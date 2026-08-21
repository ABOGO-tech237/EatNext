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
const FEATURED_SEARCH_TTL = 600;
const DETAIL_TTL = 600;
const NEARBY_TTL = 300;
const STATS_TTL = 600;

const STATS_CACHE_KEY = 'restaurants:stats:v2';
const FILTERS_CACHE_KEY = 'restaurants:filters:v1';
const FILTERS_TTL = 300;

/** Champs liste : `osmTags` pour badges Terrasse / Livraison, `createdAt` pour « Nouveaux ». */
const LIST_SELECT = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  address: true,
  city: true,
  lat: true,
  lng: true,
  cuisineType: true,
  priceRange: true,
  avgRating: true,
  reviewCount: true,
  photos: true,
  status: true,
  source: true,
  osmId: true,
  osmType: true,
  openingHours: true,
  phone: true,
  website: true,
  createdAt: true,
  osmTags: true,
} satisfies Prisma.RestaurantSelect;

/** Requête homepage fréquente : pas de filtres, tri par note décroissante. */
function isFeaturedSearch(params: RestaurantSearchParams, page: number, limit: number): boolean {
  return (
    page === 1 &&
    limit <= 6 &&
    params.sortBy === 'rating' &&
    (params.order === 'desc' || params.order === undefined) &&
    !params.q &&
    !params.city &&
    !params.cuisine &&
    params.lat == null &&
    params.lng == null &&
    !params.minRating &&
    !params.priceRange
  );
}

function buildOrderBy(
  params: RestaurantSearchParams,
): Prisma.RestaurantOrderByWithRelationInput {
  if (params.sortBy === 'name') {
    return { name: params.order ?? 'asc' };
  }
  if (params.sortBy === 'createdAt') {
    return { createdAt: params.order ?? 'desc' };
  }
  return { avgRating: params.order ?? 'desc' };
}

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
  sortBy?: 'rating' | 'distance' | 'name' | 'createdAt';
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
      { city: { contains: params.q, mode: 'insensitive' } },
      { address: { contains: params.q, mode: 'insensitive' } },
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
      orderBy: buildOrderBy(params),
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
  const ttl = isFeaturedSearch(params, page, limit) ? FEATURED_SEARCH_TTL : SEARCH_TTL;
  await cacheSet(cacheKey, { items: enriched, total }, ttl);
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
 * Crée un restaurant pour le compte de l'utilisateur courant.
 * Politique v2 : publié immédiatement (badge « Non vérifié » côté UI),
 * `source: USER_SUBMITTED`, promotion du rôle `user` → `owner`.
 * Rejette les doublons (même nom, même ville, ~200 m).
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
    phone?: string;
    website?: string;
    openingHours?: string;
  },
) {
  const name = data.name.trim();
  const city = data.city.trim();
  const duplicate = await findPublishedDuplicate(name, city, data.lat, data.lng);
  if (duplicate) {
    throw new AppError(
      'DUPLICATE_RESTAURANT',
      `Un restaurant publié similaire existe déjà. Revendiquez-le plutôt (id : ${duplicate.id}).`,
      409,
    );
  }

  const restaurant = await prisma.$transaction(async (tx) => {
    const created = await tx.restaurant.create({
      data: {
        name,
        description: data.description,
        address: data.address,
        city,
        lat: data.lat,
        lng: data.lng,
        cuisineType: data.cuisineType,
        priceRange: data.priceRange,
        photos: data.photos ?? [],
        phone: data.phone,
        website: data.website ? data.website : undefined,
        openingHours: data.openingHours,
        ownerId: userId,
        source: 'USER_SUBMITTED',
        status: 'published',
      },
    });
    await tx.user.updateMany({
      where: { id: userId, role: 'user' },
      data: { role: 'owner' },
    });
    return created;
  });

  await cacheDelPattern('restaurants:*');
  return restaurant;
}

/** Doublon publié : même nom (insensible à la casse) dans la même ville, à ~200 m. */
async function findPublishedDuplicate(name: string, city: string, lat: number, lng: number) {
  const candidates = await prisma.restaurant.findMany({
    where: {
      status: 'published',
      city: { equals: city, mode: 'insensitive' },
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true, lat: true, lng: true, name: true },
  });
  return candidates.find((r) => haversineKm(lat, lng, r.lat, r.lng) * 1000 <= 200) ?? null;
}

/**
 * Revendique une fiche existante. N'utilise pas `updateRestaurant` (contrôle
 * propriétaire trop tôt). Idempotent si déjà propriétaire.
 */
export async function claimRestaurant(id: string, userId: string) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);

  if (restaurant.ownerId && restaurant.ownerId !== userId) {
    throw new AppError(
      'ALREADY_CLAIMED',
      'Ce restaurant est déjà revendiqué par un autre propriétaire.',
      409,
    );
  }

  if (restaurant.ownerId === userId) {
    return restaurant;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.restaurant.update({
      where: { id },
      data: { ownerId: userId },
    });
    await tx.user.updateMany({
      where: { id: userId, role: 'user' },
      data: { role: 'owner' },
    });
    return claimed;
  });

  await cacheDelPattern('restaurants:*');
  await cacheDelPattern(`restaurant:${id}:*`);
  return updated;
}

/** Restaurants dont l'utilisateur est propriétaire (tous statuts). */
export async function getMyRestaurants(userId: string, page = 1, limit = 20) {
  const safeLimit = Math.min(limit, 50);
  const where = { ownerId: userId };
  const [items, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      select: LIST_SELECT,
      skip: (page - 1) * safeLimit,
      take: safeLimit,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.restaurant.count({ where }),
  ]);
  return { items, total, page, limit: safeLimit };
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
    phone: string;
    website: string;
    openingHours: string;
    status: RestaurantStatus;
  }>,
) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);
  if (role !== 'admin' && restaurant.ownerId !== userId) {
    throw new AppError('FORBIDDEN', 'Vous ne pouvez pas modifier ce restaurant.', 403);
  }

  const { status, ...safeData } = data;
  const payload: Prisma.RestaurantUpdateInput = { ...safeData };
  if (role === 'admin' && status) {
    payload.status = status;
  }

  const updated = await prisma.restaurant.update({ where: { id }, data: payload });
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
  category?: string;
}

/** Menu d'un restaurant, trié par `sortOrder` — tableau plat (API v2). */
export async function getRestaurantMenu(restaurantId: string): Promise<MenuItemInput[]> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });
  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);

  const items = await prisma.menuItem.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: 'asc' },
  });

  return items.map((item) => ({
    name: item.name,
    price: item.price,
    description: item.description ?? undefined,
    category: item.category ?? undefined,
  }));
}

/** Remplace intégralement le menu (transaction atomique). */
export async function replaceRestaurantMenu(
  restaurantId: string,
  userId: string,
  role: string,
  items: MenuItemInput[],
) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);
  if (role !== 'admin' && restaurant.ownerId !== userId) {
    throw new AppError('FORBIDDEN', 'Vous ne pouvez pas modifier ce menu.', 403);
  }

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.deleteMany({ where: { restaurantId } });
    if (items.length > 0) {
      await tx.menuItem.createMany({
        data: items.map((item, index) => ({
          restaurantId,
          name: item.name,
          price: item.price,
          description: item.description,
          category: item.category,
          sortOrder: index,
        })),
      });
    }
  });

  await cacheDelPattern(`restaurant:${restaurantId}:*`);
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
export async function getRestaurantStats() {
  const cached = await cacheGet<{
    total: number;
    published: number;
    cities: number;
    reviews: number;
  }>(STATS_CACHE_KEY);
  if (cached) return cached;

  const [published, reviews, cityGroups] = await Promise.all([
    prisma.restaurant.count({ where: { status: 'published' } }),
    prisma.review.count(),
    prisma.restaurant.groupBy({
      by: ['city'],
      where: { status: 'published' },
    }),
  ]);

  const stats = {
    total: published,
    published,
    cities: cityGroups.length,
    reviews,
  };
  await cacheSet(STATS_CACHE_KEY, stats, STATS_TTL);
  return stats;
}

export interface SearchFilterCity {
  name: string;
  count: number;
  lat: number;
  lng: number;
}

export interface SearchFilterCuisine {
  name: string;
  count: number;
}

/** Villes et types de cuisine réellement présents sur les fiches publiées. */
export async function getSearchFilters() {
  const cached = await cacheGet<{
    cities: SearchFilterCity[];
    cuisines: SearchFilterCuisine[];
  }>(FILTERS_CACHE_KEY);
  if (cached) return cached;

  const [cityGroups, cuisineGroups] = await Promise.all([
    prisma.restaurant.groupBy({
      by: ['city'],
      where: { status: 'published' },
      _count: { _all: true },
      _avg: { lat: true, lng: true },
    }),
    prisma.restaurant.groupBy({
      by: ['cuisineType'],
      where: { status: 'published' },
      _count: { _all: true },
    }),
  ]);

  const cities = cityGroups
    .filter((g) => g.city.trim().length > 0)
    .map((g) => ({
      name: g.city,
      count: g._count._all,
      lat: g._avg.lat ?? 3.8667,
      lng: g._avg.lng ?? 11.5167,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'));

  const cuisines = cuisineGroups
    .filter((g) => g.cuisineType.trim().length > 0)
    .map((g) => ({
      name: g.cuisineType,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'));

  const result = { cities, cuisines };
  await cacheSet(FILTERS_CACHE_KEY, result, FILTERS_TTL);
  return result;
}

/** Alias historique — mêmes compteurs, clés `restaurants` / `reviews` / `cities`. */
export async function getPublicStats() {
  const stats = await getRestaurantStats();
  return {
    restaurants: stats.published,
    reviews: stats.reviews,
    cities: stats.cities,
  };
}
