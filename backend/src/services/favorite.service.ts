/**
 * Service métier des favoris.
 *
 * Les favoris sont propres à chaque utilisateur et peuvent être regroupés en
 * listes. L'ajout est idempotent (upsert) pour éviter les doublons. La liste
 * des favoris est mise en cache et invalidée à chaque mutation.
 */
import { prisma } from '../lib/prisma.js';
import { cacheDelPattern, cacheGet, cacheSet } from '../lib/redis.js';
import { AppError } from '../middleware/errorHandler.js';

const FAVORITES_TTL = 300;

export async function listFavorites(userId: string) {
  const cacheKey = `user:${userId}:favorites`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      restaurant: true,
      list: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  await cacheSet(cacheKey, favorites, FAVORITES_TTL);
  return favorites;
}

export async function addFavorite(userId: string, restaurantId: string, listId?: string) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);

  // Upsert : ajoute le favori ou met simplement à jour sa liste s'il existe déjà.
  const favorite = await prisma.favorite.upsert({
    where: { userId_restaurantId: { userId, restaurantId } },
    create: { userId, restaurantId, listId },
    update: { listId },
    include: { restaurant: true },
  });

  await cacheDelPattern(`user:${userId}:favorites`);
  return favorite;
}

export async function removeFavorite(userId: string, restaurantId: string) {
  await prisma.favorite.deleteMany({ where: { userId, restaurantId } });
  await cacheDelPattern(`user:${userId}:favorites`);
}

export async function listFavoriteLists(userId: string) {
  return prisma.favoriteList.findMany({
    where: { userId },
    include: { _count: { select: { favorites: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createFavoriteList(userId: string, name: string) {
  return prisma.favoriteList.create({ data: { userId, name } });
}

export async function addToFavoriteList(userId: string, listId: string, restaurantId: string) {
  // Vérifie que la liste appartient bien à l'utilisateur avant d'y ajouter un favori.
  const list = await prisma.favoriteList.findFirst({ where: { id: listId, userId } });
  if (!list) throw new AppError('LIST_NOT_FOUND', 'Liste introuvable.', 404);
  return addFavorite(userId, restaurantId, listId);
}

export async function isFavorite(userId: string, restaurantId: string): Promise<boolean> {
  const fav = await prisma.favorite.findUnique({
    where: { userId_restaurantId: { userId, restaurantId } },
    select: { id: true },
  });
  return !!fav;
}
