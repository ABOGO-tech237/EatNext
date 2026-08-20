import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as restaurantApi from '../lib/api/restaurants';
import type { MenuItem, SearchParams } from '../types';

/** Clés de cache React Query — centralisées pour invalidation cohérente. */
export const restaurantKeys = {
  all: ['restaurants'] as const,
  search: (params: SearchParams) => [...restaurantKeys.all, 'search', params] as const,
  detail: (id: string) => [...restaurantKeys.all, 'detail', id] as const,
  reviews: (id: string) => [...restaurantKeys.all, 'reviews', id] as const,
  nearby: (lat: number, lng: number, radius?: number, limit?: number) =>
    [...restaurantKeys.all, 'nearby', lat, lng, radius, limit] as const,
  stats: ['restaurants', 'stats'] as const,
  filters: ['restaurants', 'filters'] as const,
  mine: ['restaurants', 'mine'] as const,
  menu: (id: string) => [...restaurantKeys.all, 'menu', id] as const,
};

export function useRestaurantSearch(params: SearchParams) {
  return useQuery({
    queryKey: restaurantKeys.search(params),
    queryFn: () => restaurantApi.searchRestaurants(params),
    staleTime: 60_000,
  });
}

export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: restaurantKeys.detail(id ?? ''),
    queryFn: () => restaurantApi.getRestaurant(id!),
    enabled: !!id,
  });
}

export function useRestaurantReviews(restaurantId: string | undefined) {
  return useQuery({
    queryKey: restaurantKeys.reviews(restaurantId ?? ''),
    queryFn: () => restaurantApi.getRestaurantReviews(restaurantId!),
    enabled: !!restaurantId,
  });
}

export function useNearbyRestaurants(
  lat: number | undefined,
  lng: number | undefined,
  radius = 1500,
  limit = 4,
) {
  return useQuery({
    queryKey: restaurantKeys.nearby(lat ?? 0, lng ?? 0, radius, limit),
    queryFn: () => restaurantApi.getNearbyRestaurants(lat!, lng!, radius, limit),
    enabled: lat != null && lng != null,
    staleTime: 60_000,
  });
}

export function useRestaurantStats() {
  return useQuery({
    queryKey: restaurantKeys.stats,
    queryFn: () => restaurantApi.getRestaurantStats(),
    staleTime: 120_000,
  });
}

export function useSearchFilters() {
  return useQuery({
    queryKey: restaurantKeys.filters,
    queryFn: () => restaurantApi.getSearchFilters(),
    staleTime: 120_000,
  });
}

export function useMyRestaurants() {
  return useQuery({
    queryKey: restaurantKeys.mine,
    queryFn: () => restaurantApi.getMyRestaurants(),
  });
}

export function useRestaurantMenu(id: string | undefined) {
  return useQuery({
    queryKey: restaurantKeys.menu(id ?? ''),
    queryFn: () => restaurantApi.getRestaurantMenu(id!),
    enabled: !!id,
  });
}

export function useCreateReview(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; content?: string }) =>
      restaurantApi.createReview(restaurantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.reviews(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.detail(restaurantId) });
    },
  });
}

export function useClaimRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restaurantApi.claimRestaurant(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.mine });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
    },
  });
}

export function useReplaceMenu(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: MenuItem[]) => restaurantApi.replaceRestaurantMenu(restaurantId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.menu(restaurantId) });
    },
  });
}
