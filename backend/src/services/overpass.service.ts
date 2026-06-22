/**
 * Service Overpass API — découverte dynamique de POIs alimentaires OpenStreetMap.
 *
 * Les résultats bruts sont mis en cache Redis (TTL ~10 min) pour limiter la charge
 * sur les serveurs Overpass publics et accélérer les recherches répétées.
 */
import { env } from '../config/env.js';
import { cacheGet, cacheSet } from '../lib/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { haversineKm } from '../utils/geo.js';

/** TTL du cache Redis pour les réponses Overpass (secondes). */
const OVERPASS_CACHE_TTL = 600;

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

/**
 * Construit la requête Overpass QL pour une recherche géographique.
 * `out center` fournit le centroïde des ways/relations.
 */
function buildNearbyQuery(lat: number, lng: number, radiusMeters: number, limit: number): string {
  const r = Math.min(Math.max(radiusMeters, 100), 50000);
  const lim = Math.min(Math.max(limit, 1), 200);
  return `
[out:json][timeout:15];
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

  return `
[out:json][timeout:15];
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
    source: 'OSM_SYNC',
  };

  if (originLat != null && originLng != null) {
    dto.distance = haversineKm(originLat, originLng, dto.lat, dto.lng) * 1000;
  }

  return dto;
}

/**
 * Exécute une requête Overpass avec timeout et gestion d'erreurs HTTP.
 * Les erreurs réseau ou timeouts sont remontées comme AppError 503.
 */
async function executeOverpass(query: string): Promise<OverpassResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.overpassTimeoutMs);

  try {
    const response = await fetch(env.overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new AppError(
        'OVERPASS_ERROR',
        `Overpass API a répondu ${response.status}: ${body.slice(0, 200)}`,
        503,
      );
    }

    return (await response.json()) as OverpassResponse;
  } catch (err) {
    if (err instanceof AppError) throw err;
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Timeout Overpass API (15s). Réessayez avec un rayon plus petit.'
        : 'Impossible de joindre Overpass API.';
    throw new AppError('OVERPASS_UNAVAILABLE', message, 503);
  } finally {
    clearTimeout(timeout);
  }
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
