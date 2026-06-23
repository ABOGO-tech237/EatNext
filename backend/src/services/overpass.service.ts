/**
 * Service Overpass API — découverte dynamique de POIs alimentaires OpenStreetMap.
 *
 * Les résultats bruts sont mis en cache Redis (TTL ~10 min) pour limiter la charge
 * sur les serveurs Overpass publics et accélérer les recherches répétées.
 *
 * Overpass exige un User-Agent explicite (sinon HTTP 406).
 */
import { fetch as undiciFetch, Agent } from 'undici';
import { env } from '../config/env.js';
import { cacheGet, cacheSet } from '../lib/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { haversineKm } from '../utils/geo.js';
import { extractPhotosFromOsmTags } from '../utils/osmPhotos.js';

/** TTL du cache Redis pour les réponses Overpass (secondes). */
const OVERPASS_CACHE_TTL = 600;

/** User-Agent obligatoire pour les serveurs Overpass publics. */
const OVERPASS_USER_AGENT =
  process.env.OVERPASS_USER_AGENT ??
  'EatNext/1.0 (https://github.com/Transfomers/EatNext; contact@eatnext.africa)';

/** Types OSM supportés pour les restaurants / lieux de restauration. */
export type OsmElementType = 'node' | 'way' | 'relation';

/** DTO normalisé renvoyé par ce service (avant persistance Prisma). */
export interface OsmRestaurantDto {
  osmId: string;
  osmType: OsmElementType;
  name: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  cuisineType: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  osmTags: Record<string, string>;
  photos: string[];
  distance?: number;
  source: 'OSM_SYNC';
}

interface OverpassElement {
  type: OsmElementType;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

/** Filtre Overpass QL pour les POIs alimentaires (amenity + bakery). */
const FOOD_AMENITY_REGEX = '^(restaurant|cafe|fast_food|bar|food_court|ice_cream)$';

function overpassServerTimeoutSec(): number {
  return Math.max(15, Math.floor(env.overpassTimeoutMs / 1000) - 5);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function overpassEndpoints(): string[] {
  return [...new Set([env.overpassUrl, ...env.overpassFallbackUrls])];
}

/** Agent HTTP IPv4 — évite les échecs fetch Node quand IPv6 est indisponible. */
const overpassDispatcher = new Agent({
  connect: { family: 4, timeout: env.overpassTimeoutMs },
});

function formatFetchError(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error) {
    const cause = err.cause as NodeJS.ErrnoException | undefined;
    const causeDetail = cause?.code ?? cause?.message;
    const suffix = causeDetail ? ` [${causeDetail}]` : '';
    if (err.name === 'AbortError') {
      return `Timeout Overpass API (${env.overpassTimeoutMs / 1000}s). Réduisez le rayon ou augmentez OVERPASS_TIMEOUT_MS.`;
    }
    return `${err.message}${suffix}`;
  }
  return 'Erreur réseau inconnue';
}

/**
 * Construit la requête Overpass QL pour une recherche géographique.
 * `out center` fournit le centroïde des ways/relations.
 */
function buildNearbyQuery(lat: number, lng: number, radiusMeters: number, limit: number): string {
  const r = Math.min(Math.max(radiusMeters, 100), 50000);
  const lim = Math.min(Math.max(limit, 1), 200);
  const timeout = overpassServerTimeoutSec();
  return `
[out:json][timeout:${timeout}];
(
  node["amenity"~"${FOOD_AMENITY_REGEX}"](around:${r},${lat},${lng});
  way["amenity"~"${FOOD_AMENITY_REGEX}"](around:${r},${lat},${lng});
  relation["amenity"~"${FOOD_AMENITY_REGEX}"](around:${r},${lat},${lng});
  node["shop"="bakery"](around:${r},${lat},${lng});
  way["shop"="bakery"](around:${r},${lat},${lng});
);
out center ${lim};
`.trim();
}

/** Requête Overpass pour un élément unique par type + identifiant OSM. */
function buildByIdQuery(osmType: OsmElementType, osmId: string): string {
  const id = osmId.replace(/\D/g, '');
  if (!id) throw new AppError('VALIDATION_ERROR', 'osmId invalide.', 400);

  const prefix =
    osmType === 'node' ? 'node' : osmType === 'way' ? 'way' : 'relation';
  const timeout = overpassServerTimeoutSec();

  return `
[out:json][timeout:${timeout}];
${prefix}(${id});
out center;
`.trim();
}

/** Compose une adresse lisible depuis les tags addr:* OSM. */
function formatAddress(tags: Record<string, string>): string {
  const street = tags['addr:street'] ?? tags['addr:place'] ?? '';
  const housenumber = tags['addr:housenumber'] ?? '';
  const line = [housenumber, street].filter(Boolean).join(' ').trim();
  if (line) return line;
  return tags['addr:full'] ?? tags['address'] ?? 'Adresse non renseignée';
}

/** Extrait la ville depuis les tags OSM (priorité addr:city). */
function extractCity(tags: Record<string, string>): string {
  return (
    tags['addr:city'] ??
    tags['addr:town'] ??
    tags['addr:village'] ??
    tags['addr:municipality'] ??
    'Inconnue'
  );
}

/** Mappe le tag cuisine OSM vers notre champ cuisineType. */
function extractCuisine(tags: Record<string, string>): string {
  if (tags.cuisine) return tags.cuisine.split(';')[0].trim();
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.amenity === 'fast_food') return 'fast_food';
  if (tags.amenity === 'bar') return 'bar';
  if (tags.shop === 'bakery') return 'bakery';
  return tags.amenity ?? 'restaurant';
}

/** Résout lat/lng d'un élément Overpass (node direct ou center pour way/relation). */
function resolveCoordinates(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

/** Transforme un élément Overpass brut en DTO EatNext. */
function elementToDto(
  el: OverpassElement,
  originLat?: number,
  originLng?: number,
): OsmRestaurantDto | null {
  const coords = resolveCoordinates(el);
  if (!coords) return null;

  const tags = el.tags ?? {};
  const name = tags.name ?? tags['name:fr'] ?? tags.brand ?? `Lieu OSM ${el.type}/${el.id}`;

  const dto: OsmRestaurantDto = {
    osmId: String(el.id),
    osmType: el.type,
    name,
    lat: coords.lat,
    lng: coords.lng,
    address: formatAddress(tags),
    city: extractCity(tags),
    cuisineType: extractCuisine(tags),
    openingHours: tags.opening_hours,
    phone: tags.phone ?? tags['contact:phone'],
    website: tags.website ?? tags['contact:website'],
    osmTags: tags,
    photos: extractPhotosFromOsmTags(tags),
    source: 'OSM_SYNC',
  };

  if (originLat != null && originLng != null) {
    dto.distance = haversineKm(originLat, originLng, dto.lat, dto.lng) * 1000;
  }

  return dto;
}

/**
 * Exécute une requête Overpass sur un endpoint avec timeout et User-Agent.
 */
async function executeOverpassOnUrl(url: string, query: string): Promise<OverpassResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.overpassTimeoutMs);

  try {
    const response = await undiciFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': OVERPASS_USER_AGENT,
        Accept: 'application/json',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
      dispatcher: overpassDispatcher,
    });

    const bodyText = await response.text();

    if (!response.ok) {
      throw new AppError(
        'OVERPASS_ERROR',
        `Overpass (${url}) HTTP ${response.status}: ${bodyText.slice(0, 200)}`,
        503,
      );
    }

    try {
      return JSON.parse(bodyText) as OverpassResponse;
    } catch {
      throw new AppError(
        'OVERPASS_ERROR',
        `Réponse Overpass invalide (${url}): ${bodyText.slice(0, 200)}`,
        503,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Exécute une requête Overpass avec retries et miroirs de secours.
 */
async function executeOverpass(query: string): Promise<OverpassResponse> {
  const endpoints = overpassEndpoints();
  const errors: string[] = [];

  for (const url of endpoints) {
    for (let attempt = 1; attempt <= env.overpassMaxRetries; attempt++) {
      try {
        return await executeOverpassOnUrl(url, query);
      } catch (err) {
        const msg = formatFetchError(err);
        errors.push(`${url} (tentative ${attempt}): ${msg}`);
        if (attempt < env.overpassMaxRetries) {
          await sleep(1500 * attempt);
        }
      }
    }
  }

  throw new AppError(
    'OVERPASS_UNAVAILABLE',
    `Impossible de joindre Overpass API. ${errors.join(' | ')}`,
    503,
  );
}

/**
 * Recherche des restaurants / cafés / food POIs à proximité via Overpass.
 * Résultats triés par distance croissante.
 */
export async function searchNearby(
  lat: number,
  lng: number,
  radiusMeters = 2000,
  limit = 50,
): Promise<OsmRestaurantDto[]> {
  const cacheKey = `overpass:nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusMeters}:${limit}`;
  const cached = await cacheGet<OsmRestaurantDto[]>(cacheKey);
  if (cached) return cached;

  const query = buildNearbyQuery(lat, lng, radiusMeters, limit);
  const data = await executeOverpass(query);

  const items = data.elements
    .map((el) => elementToDto(el, lat, lng))
    .filter((dto): dto is OsmRestaurantDto => dto !== null)
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .slice(0, limit);

  await cacheSet(cacheKey, items, OVERPASS_CACHE_TTL);
  return items;
}

/**
 * Récupère un POI OSM par son identifiant (node/way/relation).
 */
export async function getByOsmId(
  osmType: OsmElementType,
  osmId: string,
): Promise<OsmRestaurantDto | null> {
  const cacheKey = `overpass:osm:${osmType}:${osmId}`;
  const cached = await cacheGet<OsmRestaurantDto | null>(cacheKey);
  if (cached) return cached;

  const query = buildByIdQuery(osmType, osmId);
  const data = await executeOverpass(query);
  const el = data.elements[0];
  const dto = el ? elementToDto(el) : null;

  await cacheSet(cacheKey, dto, OVERPASS_CACHE_TTL);
  return dto;
}
