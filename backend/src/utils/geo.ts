/**
 * Utilitaires géographiques et de cache.
 * - `hashSearchParams` : clé de cache stable dérivée des filtres de recherche.
 * - `haversineKm`       : distance à vol d'oiseau entre deux points (km).
 * - `geohashPrefix`     : préfixe lat/lng arrondi servant de clé de cache « zone ».
 */
import crypto from 'crypto';

export function hashSearchParams(params: Record<string, unknown>): string {
  const normalized = JSON.stringify(
    Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        if (params[key] !== undefined && params[key] !== '') acc[key] = params[key];
        return acc;
      }, {}),
  );
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function geohashPrefix(lat: number, lng: number, precision = 4): string {
  return `${lat.toFixed(precision)}:${lng.toFixed(precision)}`;
}
