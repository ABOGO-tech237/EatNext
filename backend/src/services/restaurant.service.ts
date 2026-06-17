import { Prisma, RestaurantStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { cacheDelPattern, cacheGet, cacheSet } from '../lib/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { geohashPrefix, haversineKm, hashSearchParams } from '../utils/geo.js';

const SEARCH_TTL = 300;
const DETAIL_TTL = 600;
const NEARBY_TTL = 300;

export interface RestaurantSearchParams {
  q?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  cuisine?: string;
  minRating?: number;
  priceRange?: number;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'distance' | 'name';
  order?: 'asc' | 'desc';
}

function buildWhere(params: RestaurantSearchParams): Prisma.RestaurantWhereInput {
  const where: Prisma.RestaurantWhereInput = { status: 'published' };

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { description: { contains: params.q, mode: 'insensitive' } },
      { cuisineType: { contains: params.q, mode: 'insensitive' } },
    ];
  }
  if (params.city) where.city = { equals: params.city, mode: 'insensitive' };
  if (params.cuisine) where.cuisineType = { equals: params.cuisine, mode: 'insensitive' };
  if (params.minRating) where.avgRating = { gte: params.minRating };
  if (params.priceRange) where.priceRange = params.priceRange;

  return where;
}

export async function searchRestaurants(params: RestaurantSearchParams) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 50);
  const cacheKey = `restaurants:search:${hashSearchParams({ ...params, page, limit })}`;

  const cached = await cacheGet<{ items: unknown[]; total: number }>(cacheKey);
  if (cached) {
    return { ...cached, page, limit, cached: true };
  }

  const where = buildWhere(params);
  const [items, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy:
        params.sortBy === 'name'
          ? { name: params.order ?? 'asc' }
          : { avgRating: params.order ?? 'desc' },
    }),
    prisma.restaurant.count({ where }),
  ]);

  let enriched = items;
  if (params.lat != null && params.lng != null) {
    enriched = items
      .map((r) => ({
        ...r,
        distance: haversineKm(params.lat!, params.lng!, r.lat, r.lng) * 1000,
      }))
      .filter((r) => !params.radius || r.distance <= params.radius)
      .sort((a, b) => {
        if (params.sortBy === 'distance') return a.distance - b.distance;
        if (params.sortBy === 'name') return params.order === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
        return params.order === 'asc' ? a.avgRating - b.avgRating : b.avgRating - a.avgRating;
      });
  }

  const result = { items: enriched, total, page, limit };
  await cacheSet(cacheKey, { items: enriched, total }, SEARCH_TTL);
  return result;
}

export async function getNearbyRestaurants(lat: number, lng: number, radius = 5000, limit = 20) {
  const cacheKey = `restaurants:nearby:${geohashPrefix(lat, lng)}:${radius}:${limit}`;
  const cached = await cacheGet<{ items: unknown[] }>(cacheKey);
  if (cached) return cached;

  const delta = radius / 111000;
  const items = await prisma.restaurant.findMany({
    where: {
      status: 'published',
      lat: { gte: lat - delta, lte: lat + delta },
      lng: { gte: lng - delta, lte: lng + delta },
    },
    take: limit * 3,
  });

  const enriched = items
    .map((r) => ({ ...r, distance: haversineKm(lat, lng, r.lat, r.lng) * 1000 }))
    .filter((r) => r.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  const result = { items: enriched };
  await cacheSet(cacheKey, result, NEARBY_TTL);
  return result;
}

export async function getRestaurantById(id: string) {
  const cacheKey = `restaurant:${id}:details`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return cached;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
      _count: { select: { reviews: true, favorites: true } },
    },
  });

  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);
  await cacheSet(cacheKey, restaurant, DETAIL_TTL);
  return restaurant;
}

export async function createRestaurant(
  userId: string,
  data: {
    name: string;
    description?: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
    cuisineType: string;
    priceRange: number;
    photos?: string[];
  },
) {
  const restaurant = await prisma.restaurant.create({
    data: {
      ...data,
      ownerId: userId,
      status: 'pending',
    },
  });
  await cacheDelPattern('restaurants:*');
  return restaurant;
}

export async function updateRestaurant(
  id: string,
  userId: string,
  role: string,
  data: Partial<{
    name: string;
    description: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
    cuisineType: string;
    priceRange: number;
    photos: string[];
    status: RestaurantStatus;
  }>,
) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);
  if (role !== 'admin' && restaurant.ownerId !== userId) {
    throw new AppError('FORBIDDEN', 'Vous ne pouvez pas modifier ce restaurant.', 403);
  }

  const updated = await prisma.restaurant.update({ where: { id }, data });
  await cacheDelPattern('restaurants:*');
  await cacheDelPattern(`restaurant:${id}:*`);
  return updated;
}

export async function deleteRestaurant(id: string) {
  await prisma.restaurant.delete({ where: { id } });
  await cacheDelPattern('restaurants:*');
  await cacheDelPattern(`restaurant:${id}:*`);
}

export async function recalculateRating(restaurantId: string) {
  const agg = await prisma.review.aggregate({
    where: { restaurantId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count.rating,
    },
  });
  await cacheDelPattern(`restaurant:${restaurantId}:*`);
  await cacheDelPattern('restaurants:*');
}
