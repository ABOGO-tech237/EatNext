import { apiClient, withMockFallback } from './client';
import {
  getMockFavorites,
  isMockFavorite,
  toggleMockFavorite,
} from '../mockData';
import type { Favorite } from '../../types';

/** Liste des favoris de l'utilisateur connecté. */
export async function listFavorites(): Promise<Favorite[]> {
  return withMockFallback(
    async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Favorite[] }>('/favorites');
      return data.data;
    },
    () => getMockFavorites(),
  );
}

/** Ajoute un restaurant aux favoris. */
export async function addFavorite(restaurantId: string): Promise<Favorite> {
  return withMockFallback(
    async () => {
      const { data } = await apiClient.post<{ success: boolean; data: Favorite }>(
        `/favorites/${restaurantId}`,
      );
      return data.data;
    },
    () => {
      toggleMockFavorite(restaurantId);
      const fav = getMockFavorites().find((f) => f.restaurantId === restaurantId);
      if (!fav) throw new Error('Impossible d\'ajouter le favori');
      return fav;
    },
  );
}

/** Retire un restaurant des favoris. */
export async function removeFavorite(restaurantId: string): Promise<void> {
  return withMockFallback(
    async () => {
      await apiClient.delete(`/favorites/${restaurantId}`);
    },
    () => {
      if (isMockFavorite(restaurantId)) toggleMockFavorite(restaurantId);
    },
  );
}

/** Vérifie si un restaurant est en favori (pour l'UI). */
export async function checkIsFavorite(restaurantId: string): Promise<boolean> {
  return withMockFallback(
    async () => {
      const favorites = await listFavorites();
      return favorites.some((f) => f.restaurantId === restaurantId);
    },
    () => isMockFavorite(restaurantId),
  );
}
