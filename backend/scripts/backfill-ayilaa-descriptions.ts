/**
 * Remplit `restaurants.description` depuis la fiche Ayilaa (Aperçu).
 * Usage : npx tsx scripts/backfill-ayilaa-descriptions.ts
 */
import { prisma } from '../src/lib/prisma.js';
import { fetchAyilaaDescription } from '../src/utils/ayilaaDescription.js';

async function main() {
  const rows = await prisma.restaurant.findMany({
    where: { source: 'AYILAA_IMPORT', website: { not: null } },
    select: { id: true, name: true, website: true },
  });

  let updated = 0;
  let missed = 0;

  for (const [i, row] of rows.entries()) {
    if (!row.website) continue;
    const description = await fetchAyilaaDescription(row.website);
    if (!description) {
      missed++;
      console.warn(`[backfill] pas d’Aperçu — ${row.name}`);
      continue;
    }
    await prisma.restaurant.update({ where: { id: row.id }, data: { description } });
    updated++;
    if ((i + 1) % 10 === 0) {
      console.log(`[backfill] ${i + 1}/${rows.length} (${updated} mises à jour)`);
    }
  }

  console.log(`[backfill] Terminé. ${updated} descriptions Ayilaa, ${missed} sans Aperçu.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
