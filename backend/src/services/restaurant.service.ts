/**
 * Service métier des restaurants.
 *
 * Encapsule l'accès Prisma et la logique de recherche/géolocalisation, avec
 * une couche de cache Redis « best-effort » : un cache indisponible ne casse
 * jamais la requête, il dégrade simplement les performances. Les écritures
 * invalident systématiquement les clés de cache impactées.
 */
import { Prisma, RestaurantStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { cacheDelPattern, cacheGet, cacheSet } from '../lib/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { geohashPrefix, haversineKm, hashSearchParams } from '../utils/geo.js';
import * as overpassService from './overpass.service.js';
import * as osmSyncService from './osmSync.service.js';

// Durées de vie (secondes) des différentes entrées de cache.
const SEARCH_TTL = 300;
const DETAIL_TTL = 600;
const NEARBY_TTL = 300;

/** Restaurant enrichi tel que renvoyé par `getRestaurantById` (avec relations). */
type RestaurantDetail = Prisma.RestaurantGetPayload<{
  include: {
    owner: { select: { id: true; fullName: true; email: true } };
    _count: { select: { reviews: true; favorites: true } };
  };
}>;

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

/**
 * Construit la clause `where` Prisma à partir des filtres de recherche.
 * Seuls les restaurants `published` sont visibles publiquement.
 */
function buildWhere(params: RestaurantSearchParams): Prisma.RestaurantWhereInput {
  const where: Prisma.RestaurantWhereInput = { status: 'published' };

  if (params.q) {
    // Recherche insensible à la casse sur les champs textuels principaux.
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

/**
 * Recherche paginée de restaurants. Le résultat est mis en cache sous une clé
 * dérivée du hash des paramètres ; le filtrage/tri par distance est appliqué
 * en mémoire lorsqu'une position (lat/lng) est fournie.
 */
export async function searchRestaurants(params: RestaurantSearchParams) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 50);
  const cacheKey = `restaurants:search:${hashSearchParams({ ...params, page, limit })}`;

  // 1. Tentative de lecture depuis le cache.
  const cached = await cacheGet<{ items: unknown[]; total: number }>(cacheKey);
  if (cached) {
    return { ...cached, page, limit, cached: true };
  }

  // 2. Requête base : page d'éléments + total pour la pagination.
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

  // 3. Enrichissement géographique optionnel (distance en mètres + tri/filtre).
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

/**
 * Restaurants proches d'un point. On pré-filtre par une « boîte » lat/lng
 * (approximation rapide en base) puis on affine avec la distance haversine
 * exacte, en triant par proximité.
 */
export async function getNearbyRestaurants(lat: number, lng: number, radius = 5000, limit = 20) {
  const cacheKey = `restaurants:nearby:${geohashPrefix(lat, lng)}:${radius}:${limit}`;
  const cached = await cacheGet<{ items: unknown[] }>(cacheKey);
  if (cached) return cached;

  // ~111 km par degré de latitude : convertit le rayon (m) en delta de degrés.
  const delta = radius / 111000;
  const items = await prisma.restaurant.findMany({
    where: {
      status: 'published',
      lat: { gte: lat - delta, lte: lat + delta },
      lng: { gte: lng - delta, lte: lng + delta },
    },
    take: limit * 3, // marge car la boîte est plus large que le cercle réel.
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

/** Identifiant synthétique pour un POI OSM non encore persisté en base. */
function syntheticOsmId(osmType: string, osmId: string): string {
  return `osm-${osmType}-${osmId}`;
}

/**
 * Restaurants OSM à proximité — Overpass dynamique ou sync DB si `sync=true`.
 */
export async function getOsmNearbyRestaurants(
  lat: number,
  lng: number,
  radius = 2000,
  limit = 50,
  sync = false,
) {
  if (sync) {
    const { items } = await osmSyncService.syncNearbyToDb(lat, lng, radius, limit);
    const enriched = items
      .map((r) => ({
        ...r,
        distance: haversineKm(lat, lng, r.lat, r.lng) * 1000,
      }))
      .sort((a, b) => a.distance - b.distance);
    return { items: enriched, source: 'db_synced' as const };
  }

  const osmItems = await overpassService.searchNearby(lat, lng, radius, limit);
  const items = osmItems.map((dto) => ({
    id: syntheticOsmId(dto.osmType, dto.osmId),
    name: dto.name,
    address: dto.address,
    city: dto.city,
    lat: dto.lat,
    lng: dto.lng,
    cuisineType: dto.cuisineType,
    priceRange: 2,
    avgRating: 0,
    reviewCount: 0,
    photos: dto.photos,
    status: 'published' as const,
    source: 'OSM_SYNC' as const,
    osmId: dto.osmId,
    osmType: dto.osmType,
    osmTags: dto.osmTags,
    openingHours: dto.openingHours ?? null,
    phone: dto.phone ?? null,
    website: dto.website ?? null,
    distance: dto.distance,
  }));

  return { items, source: 'overpass' as const };
}

/**
 * Fusionne restaurants publiés en base (inclut OSM_SYNC déjà synchronisés).
 * Pas d'appel Overpass live — évite les timeouts ; utiliser POST /osm/sync pour enrichir.
 */
export async function getMergedNearbyRestaurants(
  lat: number,
  lng: number,
  radius = 5000,
  limit = 20,
  includeOsm = false,
) {
  const effectiveLimit = includeOsm ? Math.min(limit * 2, 50) : limit;
  const result = await getNearbyRestaurants(lat, lng, radius, effectiveLimit);
  const items = result.items as Array<{ source?: string }>;
  return {
    items: result.items,
    osmCount: items.filter((r) => r.source === 'OSM_SYNC').length,
    dbCount: items.length,
  };
}

/** Détail d'un restaurant (avec propriétaire et compteurs), mis en cache. */
export async function getRestaurantById(id: string): Promise<RestaurantDetail> {
  const cacheKey = `restaurant:${id}:details`;
  const cached = await cacheGet<RestaurantDetail>(cacheKey);
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

/**
 * Crée un restaurant pour le compte de l'utilisateur courant. Il est créé au
 * statut `pending` : il devra être approuvé par un admin avant publication.
 */
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
  // Invalide les listes de recherche en cache (un nouvel élément est apparu).
  await cacheDelPattern('restaurants:*');
  return restaurant;
}

/**
 * Met à jour un restaurant. Contrôle d'accès : seul le propriétaire du
 * restaurant ou un admin peut le modifier. Invalide ensuite les caches liés.
 */
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

/** Supprime un restaurant (réservé aux admins au niveau route) + purge caches. */
export async function deleteRestaurant(id: string) {
  await prisma.restaurant.delete({ where: { id } });
  await cacheDelPattern('restaurants:*');
  await cacheDelPattern(`restaurant:${id}:*`);
}

export interface MenuItemInput {
  name: string;
  price: number;
  description?: string;
}

/** Menu d'un restaurant, trié par `sortOrder`. */
export async function getRestaurantMenu(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });
  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);

  const items = await prisma.menuItem.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: 'asc' },
  });

  return { restaurantId, items };
}

/** Remplace intégralement le menu (transaction atomique). */
export async function replaceRestaurantMenu(restaurantId: string, items: MenuItemInput[]) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.deleteMany({ where: { restaurantId } });
    if (items.length > 0) {
      await tx.menuItem.createMany({
        data: items.map((item, index) => ({
          restaurantId,
          name: item.name,
          price: item.price,
          description: item.description,
          sortOrder: index,
        })),
      });
    }
  });

  return getRestaurantMenu(restaurantId);
}

/**
 * Recalcule la note moyenne et le nombre d'avis d'un restaurant. Appelé après
 * toute création/modification/suppression d'avis pour garder ces champs
 * dénormalisés cohérents.
 */
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

/** Compteurs publics pour la page d'accueil (données réelles en base). */
export async function getPublicStats() {
  const [restaurants, reviews, cityRows] = await Promise.all([
    prisma.restaurant.count({ where: { status: 'published' } }),
    prisma.review.count(),
    prisma.restaurant.findMany({
      where: { status: 'published' },
      select: { city: true },
      distinct: ['city'],
    }),
  ]);

  return {
    restaurants,
    reviews,
    cities: cityRows.length,
  };
}
