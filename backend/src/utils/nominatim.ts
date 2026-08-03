/**
 * Client Nominatim (OpenStreetMap) pour géocodage à l'import Ayilaa.
 * Respecte la politique d'usage : 1 requête/seconde, User-Agent identifié.
 */
import fs from 'node:fs';
import path from 'node:path';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = process.env.NOMINATIM_USER_AGENT ?? 'EatNext/1.0 (import@eatnext.africa)';
const MIN_INTERVAL_MS = 1100;

export interface GeoPoint {
  lat: number;
  lng: number;
  source: 'nominatim' | 'centroid';
}

type CacheEntry = GeoPoint & { query: string };

let lastRequestAt = 0;
let cache: Record<string, CacheEntry> = {};
let cachePath: string | null = null;
let cacheDirty = false;

/** Centroïdes approximatifs pour fallback par ville (Cameroun). */
export const CITY_CENTROIDS: Record<string, GeoPoint> = {
  Douala: { lat: 4.0511, lng: 9.7679, source: 'centroid' },
  Yaoundé: { lat: 3.8667, lng: 11.5167, source: 'centroid' },
  Yaounde: { lat: 3.8667, lng: 11.5167, source: 'centroid' },
  Bafoussam: { lat: 5.4737, lng: 10.4176, source: 'centroid' },
  Buea: { lat: 4.1527, lng: 9.2414, source: 'centroid' },
  Limbé: { lat: 4.0167, lng: 9.2167, source: 'centroid' },
  Bamenda: { lat: 5.9631, lng: 10.1591, source: 'centroid' },
  Garoua: { lat: 9.3265, lng: 13.3953, source: 'centroid' },
  Bertoua: { lat: 4.5833, lng: 13.6833, source: 'centroid' },
  Kribi: { lat: 2.9373, lng: 9.9077, source: 'centroid' },
  Ebolowa: { lat: 2.9, lng: 11.15, source: 'centroid' },
  Maroua: { lat: 10.591, lng: 14.3159, source: 'centroid' },
  Ngaoundéré: { lat: 7.3167, lng: 13.5833, source: 'centroid' },
  Ngaoundere: { lat: 7.3167, lng: 13.5833, source: 'centroid' },
};

export function initNominatimCache(dir: string) {
  cachePath = path.join(dir, 'nominatim.json');
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as Record<string, CacheEntry>;
    } catch {
      cache = {};
    }
  }
}

export function flushNominatimCache() {
  if (!cachePath || !cacheDirty) return;
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  cacheDirty = false;
}

async function throttle() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

async function fetchNominatim(query: string): Promise<GeoPoint | null> {
  await throttle();

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'cm',
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      });

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }

      if (!res.ok) return null;

      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data.length) return null;

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        source: 'nominatim',
      };
    } catch {
      if (attempt === 2) return null;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }

  return null;
}

export function cityCentroid(city: string | null | undefined): GeoPoint | null {
  if (!city) return null;
  const key = city.trim();
  return CITY_CENTROIDS[key] ?? CITY_CENTROIDS[key.normalize('NFD').replace(/\p{Diacritic}/gu, '')] ?? null;
}

/**
 * Géocode une adresse ; utilise le cache disque et optionnellement le centroïde ville.
 */
export async function geocodeAddress(
  query: string,
  options?: { fallbackCentroid?: string | null },
): Promise<GeoPoint | null> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options?.fallbackCentroid ? cityCentroid(options.fallbackCentroid) : null;
  }

  const cached = cache[normalized];
  if (cached) return { lat: cached.lat, lng: cached.lng, source: cached.source };

  let point = await fetchNominatim(query);

  if (!point && options?.fallbackCentroid) {
    point = cityCentroid(options.fallbackCentroid);
  }

  if (point) {
    cache[normalized] = { ...point, query };
    cacheDirty = true;
  }

  return point;
}
