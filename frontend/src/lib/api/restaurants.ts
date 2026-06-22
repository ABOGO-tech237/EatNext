import { apiClient, withMockFallback } from './client';
import {
  MOCK_RESTAURANTS,
  MOCK_REVIEWS,
  searchMockRestaurants,
} from '../mockData';
import type { ApiResponse, PaginationMeta, Restaurant, Review, SearchParams } from '../../types';

/** Recherche paginée de restaurants (GET /restaurants). */
export async function searchRestaurants(
  params: SearchParams,
): Promise<{ items: Restaurant[]; meta: PaginationMeta }> {
  return withMockFallback(
    async () => {
      const { data } = await apiClient.get<ApiResponse<Restaurant[]>>('/restaurants', { params });
      return {
        items: data.data,
        meta: data.meta ?? { page: 1, limit: 20, total: data.data.length },
      };
    },
    () => {
      const items = searchMockRestaurants(params);
      return { items, meta: { page: 1, limit: 20, total: items.length } };
    },
  );
}

/** Détail d'un restaurant par identifiant. */
export async function getRestaurant(id: string): Promise<Restaurant> {
  return withMockFallback(
    async () => {
      const { data } = await apiClient.get<ApiResponse<Restaurant>>(`/restaurants/${id}`);
      return data.data;
    },
    () => {
      const found = MOCK_RESTAURANTS.find((r) => r.id === id);
      if (!found) throw new Error('Restaurant introuvable');
      return found;
    },
  );
}

/** Restaurants à proximité — option fusion OSM via includeOsm. */
export async function getNearbyRestaurants(
  lat: number,
  lng: number,
  radius = 5000,
  limit = 30,
  includeOsm = false,
): Promise<Restaurant[]> {
  return withMockFallback(
    async () => {
      const { data } = await apiClient.get<ApiResponse<Restaurant[]>>('/restaurants/nearby', {
        params: { lat, lng, radius, limit, includeOsm },
      });
      return data.data;
    },
    () => MOCK_RESTAURANTS,
  );
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
  return withMockFallback(
    async () => {
      const { data } = await apiClient.get<ApiResponse<Review[]>>(
        `/reviews/restaurants/${restaurantId}/reviews`,
        { params: { page } },
      );
      return {
        items: data.data,
        meta: data.meta ?? { page, limit: 20, total: data.data.length },
      };
    },
    () => ({ items: MOCK_REVIEWS, meta: { page: 1, limit: 20, total: MOCK_REVIEWS.length } }),
  );
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
