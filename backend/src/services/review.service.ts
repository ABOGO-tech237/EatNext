import { prisma } from '../lib/prisma.js';
import { cacheDelPattern, cacheGet, cacheSet } from '../lib/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { recalculateRating } from './restaurant.service.js';

const REVIEWS_TTL = 120;

export async function listRestaurantReviews(restaurantId: string, page = 1, limit = 20) {
  const cacheKey = `restaurant:${restaurantId}:reviews:${page}:${limit}`;
  const cached = await cacheGet<{ items: unknown[]; total: number }>(cacheKey);
  if (cached) return { ...cached, page, limit };

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { restaurantId },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { restaurantId } }),
  ]);

  const result = { items, total, page, limit };
  await cacheSet(cacheKey, { items, total }, REVIEWS_TTL);
  return result;
}

export async function createReview(
  userId: string,
  restaurantId: string,
  data: { rating: number; content?: string; photos?: string[] },
) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || restaurant.status !== 'published') {
    throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);
  }

  const existing = await prisma.review.findUnique({
    where: { userId_restaurantId: { userId, restaurantId } },
  });
  if (existing) throw new AppError('REVIEW_EXISTS', 'Vous avez déjà laissé un avis.', 409);

  const review = await prisma.review.create({
    data: { userId, restaurantId, ...data },
    include: { user: { select: { id: true, fullName: true } } },
  });

  await recalculateRating(restaurantId);
  await cacheDelPattern(`restaurant:${restaurantId}:reviews:*`);
  return review;
}

export async function updateReview(
  id: string,
  userId: string,
  role: string,
  data: { rating?: number; content?: string; photos?: string[] },
) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new AppError('REVIEW_NOT_FOUND', 'Avis introuvable.', 404);
  if (role !== 'admin' && review.userId !== userId) {
    throw new AppError('FORBIDDEN', 'Vous ne pouvez pas modifier cet avis.', 403);
  }

  const updated = await prisma.review.update({
    where: { id },
    data,
    include: { user: { select: { id: true, fullName: true } } },
  });
  await recalculateRating(review.restaurantId);
  await cacheDelPattern(`restaurant:${review.restaurantId}:reviews:*`);
  return updated;
}

export async function deleteReview(id: string, userId: string, role: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new AppError('REVIEW_NOT_FOUND', 'Avis introuvable.', 404);
  if (role !== 'admin' && review.userId !== userId) {
    throw new AppError('FORBIDDEN', 'Vous ne pouvez pas supprimer cet avis.', 403);
  }

  await prisma.review.delete({ where: { id } });
  await recalculateRating(review.restaurantId);
  await cacheDelPattern(`restaurant:${review.restaurantId}:reviews:*`);
}

export async function replyToReview(id: string, ownerId: string, reply: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: { restaurant: true },
  });
  if (!review) throw new AppError('REVIEW_NOT_FOUND', 'Avis introuvable.', 404);
  if (review.restaurant.ownerId !== ownerId) {
    throw new AppError('FORBIDDEN', 'Seul le propriétaire peut répondre.', 403);
  }

  return prisma.review.update({
    where: { id },
    data: { ownerReply: reply },
  });
}

export async function flagReview(id: string) {
  return prisma.review.update({
    where: { id },
    data: { isFlagged: true },
  });
}
