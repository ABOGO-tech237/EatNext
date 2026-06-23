import { apiClient } from './client';
import type { ApiResponse, PaginationMeta, Restaurant, Review, SearchParams } from '../../types';

export interface PublicStats {
  restaurants: number;
  reviews: number;
  cities: number;
}

/** Compteurs réels (PostgreSQL) pour la page d'accueil. */
export async function getPublicStats(): Promise<PublicStats> {
  const { data } = await apiClient.get<ApiResponse<PublicStats>>('/restaurants/stats');
  return data.data;
}

/** Recherche paginée de restaurants (GET /restaurants). */
export async function searchRestaurants(
  params: SearchParams,
): Promise<{ items: Restaurant[]; meta: PaginationMeta }> {
  const { data } = await apiClient.get<ApiResponse<Restaurant[]>>('/restaurants', { params });
  return {
    items: data.data,
    meta: data.meta ?? { page: 1, limit: 20, total: data.data.length },
  };
}

/** Détail d'un restaurant par identifiant. */
export async function getRestaurant(id: string): Promise<Restaurant> {
  const { data } = await apiClient.get<ApiResponse<Restaurant>>(`/restaurants/${id}`);
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

/** POIs OpenStreetMap via Overpass (dynamique ou sync DB via API). */
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

/** Synchronise une zone OSM vers PostgreSQL via l'API backend. */
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

/** Avis d'un restaurant (GET /reviews/restaurants/:id/reviews). */
export async function getRestaurantReviews(
  restaurantId: string,
  page = 1,
): Promise<{ items: Review[]; meta: PaginationMeta }> {
  const { data } = await apiClient.get<ApiResponse<Review[]>>(
    `/reviews/restaurants/${restaurantId}/reviews`,
    { params: { page } },
  );
  return {
    items: data.data,
    meta: data.meta ?? { page, limit: 20, total: data.data.length },
  };
}

/** Publier un avis sur un restaurant. */
export async function createReview(
  restaurantId: string,
  payload: { rating: number; content?: string },
): Promise<Review> {
  const { data } = await apiClient.post<ApiResponse<Review>>(
    `/reviews/restaurants/${restaurantId}/reviews`,
    payload,
  );
  return data.data;
}
