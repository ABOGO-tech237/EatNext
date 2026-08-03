import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reviewApi from '../lib/api/reviews';
import { restaurantKeys } from './useRestaurants';

export const reviewKeys = {
  all: ['reviews'] as const,
  restaurant: (id: string, page = 1) => [...reviewKeys.all, 'restaurant', id, page] as const,
  mine: (page = 1) => [...reviewKeys.all, 'mine', page] as const,
};

/** Avis d'un restaurant (paginé). */
export function useRestaurantReviews(restaurantId: string | undefined, page = 1) {
  return useQuery({
    queryKey: reviewKeys.restaurant(restaurantId ?? '', page),
    queryFn: () => reviewApi.getRestaurantReviews(restaurantId!, page),
    enabled: !!restaurantId,
  });
}

/** Publier un avis. */
export function useCreateReview(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; content: string }) =>
      reviewApi.createReview(restaurantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.restaurant(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.detail(restaurantId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.mine() });
    },
  });
}

/** Modifier un avis. */
export function useUpdateReview(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      payload,
    }: {
      reviewId: string;
      payload: { rating?: number; content?: string };
    }) => reviewApi.updateReview(reviewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.restaurant(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.detail(restaurantId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.mine() });
    },
  });
}

/** Supprimer un avis. */
export function useDeleteReview(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => reviewApi.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.restaurant(restaurantId) });
      queryClient.invalidateQueries({ queryKey: restaurantKeys.detail(restaurantId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.mine() });
    },
  });
}

/** Signaler un avis. */
export function useReportReview(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => reviewApi.reportReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.restaurant(restaurantId) });
    },
  });
}

/** Répondre à un avis (propriétaire). */
export function useReplyToReview(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      reviewApi.replyToReview(reviewId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.restaurant(restaurantId) });
    },
  });
}

/** Mes avis (profil). */
export function useMyReviews(page = 1) {
  return useQuery({
    queryKey: reviewKeys.mine(page),
    queryFn: () => reviewApi.getMyReviews(page),
  });
}
