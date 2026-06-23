/**
 * Bootstrap et resynchronisation PostgreSQL depuis OpenStreetMap (Overpass).
 *
 * Les deux zones par défaut (Yaoundé, Douala) alimentent la base ;
 * les mises à jour périodiques rafraîchissent les POIs existants (upsert par osmId).
 */
import { prisma } from '../lib/prisma.js';
import { env, type OsmSyncZone } from '../config/env.js';
import * as osmSyncService from './osmSync.service.js';

export interface BootstrapResult {
  zones: Array<{ name: string; synced: number }>;
  totalSynced: number;
  purged: number;
}

/** Supprime les restaurants hors OSM (anciennes données seed / fictives). */
export async function purgeNonOsmRestaurants(): Promise<number> {
  const legacy = await prisma.restaurant.findMany({
    where: { source: { not: 'OSM_SYNC' } },
    select: { id: true },
  });

  if (legacy.length === 0) return 0;

  const ids = legacy.map((r) => r.id);

  await prisma.$transaction([
    prisma.favorite.deleteMany({ where: { restaurantId: { in: ids } } }),
    prisma.review.deleteMany({ where: { restaurantId: { in: ids } } }),
    prisma.menuItem.deleteMany({ where: { restaurantId: { in: ids } } }),
    prisma.complaint.deleteMany({ where: { restaurantId: { in: ids } } }),
    prisma.restaurant.deleteMany({ where: { id: { in: ids } } }),
  ]);

  return legacy.length;
}

/** Synchronise toutes les zones configurées (Overpass → PostgreSQL). */
export async function bootstrapAllZones(options?: {
  purge?: boolean;
  zones?: OsmSyncZone[];
}): Promise<BootstrapResult> {
  const zones = options?.zones ?? env.osmSyncZones;
  let purged = 0;

  if (options?.purge ?? env.osmPurgeNonOsm) {
    purged = await purgeNonOsmRestaurants();
    if (purged > 0) {
      console.log(`[osm-bootstrap] Purged ${purged} non-OSM restaurant(s)`);
    }
  }

  const results: BootstrapResult['zones'] = [];
  let totalSynced = 0;

  for (const zone of zones) {
    console.log(
      `[osm-bootstrap] Syncing ${zone.name} (lat=${zone.lat}, lng=${zone.lng}, r=${zone.radius}m)…`,
    );
    const { synced } = await osmSyncService.syncNearbyToDb(
      zone.lat,
      zone.lng,
      zone.radius,
      zone.limit,
    );
    results.push({ name: zone.name, synced });
    totalSynced += synced;
    console.log(`[osm-bootstrap] ${zone.name}: ${synced} restaurant(s)`);
  }

  return { zones: results, totalSynced, purged };
}

/** Resynchronisation légère (sans purge) — utilisée par le scheduler. */
export async function resyncAllZones(): Promise<BootstrapResult> {
  return bootstrapAllZones({ purge: false });
}
