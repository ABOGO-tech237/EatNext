import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as restaurantApi from '../lib/api/restaurants';
import type { SearchParams } from '../types';

/** Clés de cache React Query — centralisées pour invalidation cohérente. */
export const restaurantKeys = {
  all: ['restaurants'] as const,
  stats: () => [...restaurantKeys.all, 'stats'] as const,
  search: (params: SearchParams) => [...restaurantKeys.all, 'search', params] as const,
  detail: (id: string) => [...restaurantKeys.all, 'detail', id] as const,
  nearby: (lat: number, lng: number, includeOsm: boolean) =>
    [...restaurantKeys.all, 'nearby', lat, lng, includeOsm] as const,
};

/** Statistiques publiques (restaurants / avis / villes en base). */
export function usePublicStats() {
  return useQuery({
    queryKey: restaurantKeys.stats(),
    queryFn: () => restaurantApi.getPublicStats(),
    staleTime: 120_000,
  });
}

/** Hook de recherche avec mise en cache automatique. */
export function useRestaurantSearch(params: SearchParams) {
  return useQuery({
    queryKey: restaurantKeys.search(params),
    queryFn: () => restaurantApi.searchRestaurants(params),
    staleTime: 60_000,
  });
}

/** Hook pour le détail d'un restaurant. */
export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: restaurantKeys.detail(id ?? ''),
    queryFn: () => restaurantApi.getRestaurant(id!),
    enabled: !!id,
  });
}

/** Restaurants à proximité — fusion BDD + OSM via l'API backend. */
export function useNearbyRestaurants(
  lat: number,
  lng: number,
  radius: number,
  includeOsm: boolean,
  enabled = true,
) {
  return useQuery({
    queryKey: restaurantKeys.nearby(lat, lng, includeOsm),
    queryFn: () => restaurantApi.getNearbyRestaurants(lat, lng, radius, 50, includeOsm),
    enabled,
    staleTime: 60_000,
  });
}

/** Synchronise une zone OSM → PostgreSQL via POST /restaurants/osm/sync. */
export function useSyncOsmArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { lat: number; lng: number; radius?: number; limit?: number }) =>
      restaurantApi.syncOsmArea(params.lat, params.lng, params.radius, params.limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
    },
  });
}
