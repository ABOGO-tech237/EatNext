/**
 * Service de synchronisation OSM → PostgreSQL (Prisma).
 *
 * Stratégie hybride EatNext :
 * - Overpass pour la découverte dynamique (voir overpass.service.ts)
 * - Upsert en base pour le cache persistant et les données utilisateur (avis, favoris…)
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { cacheDelPattern } from '../lib/redis.js';
import * as overpassService from './overpass.service.js';
import type { OsmRestaurantDto } from './overpass.service.js';

/** Restaurant OSM persisté en base (aligné Prisma). */
export type SyncedOsmRestaurant = Prisma.RestaurantGetPayload<Record<string, never>>;

/**
 * Mappe un DTO Overpass vers les champs Prisma Restaurant.
 * Les restaurants OSM sont publiés automatiquement (pas de modération).
 */
function dtoToPrismaData(dto: OsmRestaurantDto): Prisma.RestaurantUncheckedCreateInput {
  return {
    name: dto.name,
    description: dto.osmTags.description ?? dto.osmTags['description:fr'] ?? null,
    address: dto.address,
    city: dto.city,
    lat: dto.lat,
    lng: dto.lng,
    cuisineType: dto.cuisineType,
    priceRange: 2,
    status: 'published',
    source: 'OSM_SYNC',
    osmId: dto.osmId,
    osmType: dto.osmType,
    osmTags: dto.osmTags as Prisma.InputJsonValue,
    lastSyncedAt: new Date(),
    openingHours: dto.openingHours ?? null,
    phone: dto.phone ?? null,
    website: dto.website ?? null,
  };
}

/**
 * Upsert un restaurant OSM par osmId (clé unique).
 * Met à jour les tags et coordonnées lors des resynchronisations.
 */
export async function upsertOsmRestaurant(dto: OsmRestaurantDto): Promise<SyncedOsmRestaurant> {
  const data = dtoToPrismaData(dto);

  const restaurant = await prisma.restaurant.upsert({
    where: { osmId: dto.osmId },
    create: data,
    update: {
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city,
      lat: data.lat,
      lng: data.lng,
      cuisineType: data.cuisineType,
      osmType: data.osmType,
      osmTags: data.osmTags,
      lastSyncedAt: data.lastSyncedAt,
      openingHours: data.openingHours,
      phone: data.phone,
      website: data.website,
      status: 'published',
      source: 'OSM_SYNC',
    },
  });

  return restaurant;
}

/**
 * Synchronise une zone géographique : Overpass → upsert PostgreSQL.
 * Retourne les restaurants persistés (avec id UUID pour liens front / avis).
 */
export async function syncNearbyToDb(
  lat: number,
  lng: number,
  radiusMeters = 2000,
  limit = 50,
): Promise<{ synced: number; items: SyncedOsmRestaurant[] }> {
  const osmItems = await overpassService.searchNearby(lat, lng, radiusMeters, limit);

  const items: SyncedOsmRestaurant[] = [];
  for (const dto of osmItems) {
    items.push(await upsertOsmRestaurant(dto));
  }

  // Purge les caches de recherche / nearby après sync.
  await cacheDelPattern('restaurants:*');
  await cacheDelPattern('overpass:*');

  return { synced: items.length, items };
}

/**
 * Synchronise un seul POI OSM par identifiant.
 */
export async function syncByOsmId(
  osmType: overpassService.OsmElementType,
  osmId: string,
): Promise<SyncedOsmRestaurant | null> {
  const dto = await overpassService.getByOsmId(osmType, osmId);
  if (!dto) return null;

  const restaurant = await upsertOsmRestaurant(dto);
  await cacheDelPattern('restaurants:*');
  return restaurant;
}
