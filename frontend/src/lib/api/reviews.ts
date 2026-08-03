import { apiClient } from './client';
import type { ApiResponse, PaginationMeta, Review } from '../../types';

export interface ReviewWithRestaurant extends Review {
  restaurant?: {
    id: string;
    name: string;
    city: string;
    photos: string[];
  };
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
  payload: { rating: number; content: string },
): Promise<Review> {
  const { data } = await apiClient.post<ApiResponse<Review>>(
    `/reviews/restaurants/${restaurantId}/reviews`,
    payload,
  );
  return data.data;
}

/** Modifier un avis. */
export async function updateReview(
  reviewId: string,
  payload: { rating?: number; content?: string },
): Promise<Review> {
  const { data } = await apiClient.put<ApiResponse<Review>>(
    `/reviews/${reviewId}`,
    payload,
  );
  return data.data;
}

/** Supprimer un avis. */
export async function deleteReview(reviewId: string): Promise<void> {
  await apiClient.delete(`/reviews/${reviewId}`);
}

/** Signaler un avis. */
export async function reportReview(reviewId: string): Promise<Review> {
  const { data } = await apiClient.post<ApiResponse<Review>>(`/reviews/${reviewId}/report`);
  return data.data;
}

/** Répondre à un avis (propriétaire). */
export async function replyToReview(reviewId: string, reply: string): Promise<Review> {
  const { data } = await apiClient.post<ApiResponse<Review>>(`/reviews/${reviewId}/reply`, {
    reply,
  });
  return data.data;
}

/** Mes avis (GET /reviews/me). */
export async function getMyReviews(
  page = 1,
): Promise<{ items: ReviewWithRestaurant[]; meta: PaginationMeta }> {
  const { data } = await apiClient.get<ApiResponse<ReviewWithRestaurant[]>>('/reviews/me', {
    params: { page },
  });
  return {
    items: data.data,
    meta: data.meta ?? { page, limit: 20, total: data.data.length },
  };
}
