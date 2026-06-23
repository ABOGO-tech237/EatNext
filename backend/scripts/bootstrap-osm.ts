/**
 * Remplit PostgreSQL depuis OpenStreetMap (Overpass) pour les zones configurées.
 * Usage : npm run db:bootstrap
 */
import { prisma } from '../src/lib/prisma.js';
import { bootstrapAllZones } from '../src/services/osmBootstrap.service.js';
import { backfillPhotosFromOsmTags } from '../src/services/osmSync.service.js';

async function main() {
  const result = await bootstrapAllZones({ purge: true });
  const photosUpdated = await backfillPhotosFromOsmTags();
  console.log('\nBootstrap complete.');
  for (const z of result.zones) {
    console.log(`  ${z.name}: ${z.synced} synced`);
  }
  console.log(`  Total: ${result.totalSynced} | Purged: ${result.purged}`);
  console.log(`  Photos updated: ${photosUpdated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
