import type { ApiResponse, Restaurant, SearchParams } from '../../types';
import { apiClient } from './client';

/** Recherche paginée de restaurants publiés. */
export async function searchRestaurants(params: SearchParams): Promise<Restaurant[]> {
  const { data } = await apiClient.get<ApiResponse<Restaurant[]>>('/restaurants', { params });
  return data.data;
}

/** Restaurants à proximité — option fusion OSM via includeOsm. */
export async function getNearbyRestaurants(
  lat: number,
  lng: number,
  radius = 5000,
  limit = 30,
  includeOsm = false,
): Promise<Restaurant[]> {
  const { data } = await apiClient.get<ApiResponse<Restaurant[]>>('/restaurants/nearby', {
    params: { lat, lng, radius, limit, includeOsm },
  });
  return data.data;
}

/** POIs OpenStreetMap via Overpass (dynamique ou sync DB). */
export async function getOsmNearby(
  lat: number,
  lng: number,
  radius = 2000,
  limit = 50,
  sync = false,
): Promise<Restaurant[]> {
  const { data } = await apiClient.get<ApiResponse<Restaurant[]>>('/restaurants/osm/nearby', {
    params: { lat, lng, radius, limit, sync },
  });
  return data.data;
}

/** Synchronise une zone OSM vers PostgreSQL. */
export async function syncOsmArea(lat: number, lng: number, radius = 2000, limit = 50) {
  const { data } = await apiClient.post<ApiResponse<{ synced: number; items: Restaurant[] }>>(
    '/restaurants/osm/sync',
    { lat, lng, radius, limit },
  );
  return data.data;
}

/** Sync un POI OSM et retourne le restaurant persisté (avec UUID). */
export async function syncOsmPlace(osmType: string, osmId: string): Promise<Restaurant> {
  const { data } = await apiClient.get<ApiResponse<Restaurant>>(
    `/restaurants/osm/${osmType}/${osmId}`,
    { params: { sync: true } },
  );
  return data.data;
}
