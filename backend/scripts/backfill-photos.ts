/**
 * Met à jour les photos OSM pour les restaurants déjà en base (sans Overpass).
 */
import { prisma } from '../src/lib/prisma.js';
import { backfillPhotosFromOsmTags } from '../src/services/osmSync.service.js';

async function main() {
  const updated = await backfillPhotosFromOsmTags();
  console.log(`Photos updated: ${updated} restaurant(s)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
