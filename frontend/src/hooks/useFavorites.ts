import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as favoritesApi from '../lib/api/favorites';

export const favoriteKeys = {
  all: ['favorites'] as const,
  check: (restaurantId: string) => [...favoriteKeys.all, 'check', restaurantId] as const,
};

/** Liste complète des favoris de l'utilisateur. */
export function useFavorites(enabled = true) {
  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: favoritesApi.listFavorites,
    enabled,
    staleTime: 30_000,
  });
}

/** Vérifie si un restaurant précis est favori. */
export function useIsFavorite(restaurantId: string, enabled = true) {
  return useQuery({
    queryKey: favoriteKeys.check(restaurantId),
    queryFn: () => favoritesApi.checkIsFavorite(restaurantId),
    enabled: enabled && !!restaurantId,
    staleTime: 15_000,
  });
}

/** Bascule favori on/off avec invalidation du cache. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      restaurantId,
      isFavorite,
    }: {
      restaurantId: string;
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        await favoritesApi.removeFavorite(restaurantId);
      } else {
        await favoritesApi.addFavorite(restaurantId);
      }
    },
    onSuccess: (_data, { restaurantId }) => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.check(restaurantId) });
    },
  });
}
