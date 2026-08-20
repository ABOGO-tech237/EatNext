import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(backendRoot, '.env') });

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

/** Zone géographique synchronisée depuis Overpass (OpenStreetMap). */
export interface OsmSyncZone {
  name: string;
  lat: number;
  lng: number;
  radius: number;
  limit: number;
}

export const DEFAULT_OSM_SYNC_ZONES: OsmSyncZone[] = [
  { name: 'Yaoundé', lat: 3.8667, lng: 11.5167, radius: 8000, limit: 150 },
  { name: 'Douala', lat: 4.0511, lng: 9.7679, radius: 8000, limit: 150 },
];

function parseOsmSyncZones(): OsmSyncZone[] {
  const raw = process.env.OSM_SYNC_ZONES;
  if (!raw) return DEFAULT_OSM_SYNC_ZONES;

  try {
    const parsed = JSON.parse(raw) as OsmSyncZone[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('OSM_SYNC_ZONES must be a non-empty JSON array');
    }
    return parsed;
  } catch (err) {
    console.warn('[env] Invalid OSM_SYNC_ZONES — using defaults (Yaoundé, Douala)', err);
    return DEFAULT_OSM_SYNC_ZONES;
  }
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: Number(process.env.JWT_EXPIRES_IN ?? 3600),
  refreshTokenSecret: required('REFRESH_TOKEN_SECRET'),
  refreshTokenExpiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN ?? 604800),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  overpassUrl: process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter',
  overpassFallbackUrls: (process.env.OVERPASS_FALLBACK_URLS ??
    'https://overpass.kumi.systems/api/interpreter,https://maps.mail.ru/osm/tools/overpass/api/interpreter')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean),
  overpassTimeoutMs: Number(process.env.OVERPASS_TIMEOUT_MS ?? 60000),
  overpassMaxRetries: Number(process.env.OVERPASS_MAX_RETRIES ?? 3),
  osmSyncZones: parseOsmSyncZones(),
  osmSyncOnStart: parseBool(process.env.OSM_SYNC_ON_START, false),
  osmSyncIntervalHours: Number(process.env.OSM_SYNC_INTERVAL_HOURS ?? 24),
  osmPurgeNonOsm: parseBool(process.env.OSM_PURGE_NON_OSM, false),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 100),
};
