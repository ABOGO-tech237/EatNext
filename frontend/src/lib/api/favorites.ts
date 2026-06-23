import { apiClient } from './client';
import type { Favorite } from '../../types';

/** Liste des favoris de l'utilisateur connecté. */
export async function listFavorites(): Promise<Favorite[]> {
  const { data } = await apiClient.get<{ success: boolean; data: Favorite[] }>('/favorites');
  return data.data;
}

/** Vérifie si un restaurant est en favori (endpoint léger). */
export async function checkIsFavorite(restaurantId: string): Promise<boolean> {
  const { data } = await apiClient.get<{ success: boolean; data: { isFavorite: boolean } }>(
    `/favorites/${restaurantId}/status`,
  );
  return data.data.isFavorite;
}

/** Ajoute un restaurant aux favoris. */
export async function addFavorite(restaurantId: string): Promise<Favorite> {
  const { data } = await apiClient.post<{ success: boolean; data: Favorite }>(
    `/favorites/${restaurantId}`,
  );
  return data.data;
}

/** Retire un restaurant des favoris. */
export async function removeFavorite(restaurantId: string): Promise<void> {
  await apiClient.delete(`/favorites/${restaurantId}`);
}
