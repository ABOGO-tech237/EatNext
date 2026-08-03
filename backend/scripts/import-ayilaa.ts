/**
 * Import Ayilaa JSONL → PostgreSQL (EatNext restaurants).
 *
 * Usage:
 *   npm run db:import-ayilaa
 *   npm run db:import-ayilaa -- --no-purge
 *   npm run db:import-ayilaa -- --fallback-centroid
 *   npm run db:import-ayilaa -- --limit 10
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import {
  flushNominatimCache,
  geocodeAddress,
  initNominatimCache,
} from '../src/utils/nominatim.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_JSONL = path.resolve(__dirname, '../../ayilaa_data.jsonl');
const CACHE_DIR = path.resolve(__dirname, '../.cache');

export interface AyilaaRecord {
  id: string;
  nom: string;
  quartier?: string;
  ville?: string | null;
  localisation_brute?: string;
  localisation?: string;
  adresse?: string | null;
  telephone?: string;
  url?: string;
  images?: string[];
  prix_a_partir_de_xaf?: number;
  note_etoiles?: number;
  nb_avis_affiches?: number;
  nb_likes?: number;
  categories?: string;
  categorie_principale?: string;
  description?: string;
  erreur?: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    purge: !args.includes('--no-purge'),
    fallbackCentroid: args.includes('--fallback-centroid'),
    limit: (() => {
      const i = args.indexOf('--limit');
      return i >= 0 ? parseInt(args[i + 1] ?? '0', 10) : 0;
    })(),
    file: (() => {
      const i = args.indexOf('--file');
      return i >= 0 ? args[i + 1]! : DEFAULT_JSONL;
    })(),
  };
}

export function normalizeCity(ville: string | null | undefined): string {
  if (!ville?.trim()) return 'Cameroun';
  const v = ville.trim();
  if (v === 'Yaounde') return 'Yaoundé';
  if (v === 'Ngaoundere') return 'Ngaoundéré';
  return v;
}

export function cleanName(nom: string): string {
  return nom
    .replace(/\s*\(\s*A partir de[\s\d,]*XAF\s*\)\s*$/i, '')
    .replace(/\s*\(\s*À partir de[\s\d,]*XAF\s*\)\s*$/i, '')
    .trim();
}

export function priceRangeFromXaf(xaf: number | undefined): number {
  const p = xaf ?? 3000;
  if (p <= 2000) return 1;
  if (p <= 5000) return 2;
  if (p <= 10000) return 3;
  return 4;
}

export function inferCuisineType(record: AyilaaRecord): string {
  const url = (record.url ?? '').toLowerCase();
  const cats = (record.categories ?? '').toLowerCase();
  if (url.includes('fast-food') || url.includes('fast_food')) return 'Fast-food';
  if (url.includes('bar')) return 'Bar / Restaurant';
  if (url.includes('patisserie') || url.includes('pizzaria') || url.includes('creperie')) {
    return 'Pâtisserie / Café';
  }
  if (url.includes('livreur') || cats.includes('livraison')) return 'Livraison';
  return record.categories?.trim() || 'Restauration';
}

export function isImportable(record: AyilaaRecord): boolean {
  if (record.erreur) return false;
  if (!record.id || !record.nom?.trim()) return false;
  if (!record.adresse && !record.localisation_brute && !record.localisation) return false;
  return true;
}

export function buildGeocodeQuery(record: AyilaaRecord, city: string): string {
  const parts = [
    record.adresse?.trim(),
    record.localisation?.trim(),
    record.quartier?.trim(),
    city,
    'Cameroun',
  ].filter(Boolean);
  return [...new Set(parts)].join(', ');
}

export function toOsmTags(record: AyilaaRecord): Prisma.InputJsonValue {
  return {
    ayilaaId: record.id,
    url: record.url ?? null,
    quartier: record.quartier ?? null,
    localisation: record.localisation ?? null,
    localisation_brute: record.localisation_brute ?? null,
    prix_a_partir_de_xaf: record.prix_a_partir_de_xaf ?? null,
    nb_likes: record.nb_likes ?? null,
    categories: record.categories ?? null,
    categorie_principale: record.categorie_principale ?? null,
  };
}

async function readJsonl(filePath: string): Promise<AyilaaRecord[]> {
  const records: AyilaaRecord[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed) as AyilaaRecord);
    } catch (err) {
      console.warn('[import-ayilaa] Ligne JSON invalide ignorée:', err);
    }
  }

  return records;
}

async function purgeRestaurants() {
  const count = await prisma.restaurant.count();
  if (count === 0) {
    console.log('[import-ayilaa] Aucun restaurant à purger.');
    return;
  }
  await prisma.restaurant.deleteMany({});
  console.log(`[import-ayilaa] ${count} restaurant(s) supprimé(s).`);
}

async function main() {
  const opts = parseArgs();

  if (!fs.existsSync(opts.file)) {
    throw new Error(`Fichier introuvable: ${opts.file}`);
  }

  initNominatimCache(CACHE_DIR);

  const allRecords = await readJsonl(opts.file);
  let records = allRecords.filter(isImportable);
  const skipped = allRecords.length - records.length;

  if (opts.limit > 0) {
    records = records.slice(0, opts.limit);
  }

  console.log(
    `[import-ayilaa] ${records.length} enregistrement(s) à importer (${skipped} ignoré(s), fichier: ${opts.file})`,
  );

  if (opts.purge) {
    await purgeRestaurants();
  }

  let imported = 0;
  let geocodeFailed = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i]!;
    const city = normalizeCity(record.ville);
    const name = cleanName(record.nom);
    const address =
      record.adresse?.trim() ||
      record.localisation?.trim() ||
      record.localisation_brute?.trim() ||
      city;
    const osmId = `ayilaa:${record.id}`;

    const query = buildGeocodeQuery(record, city);
    const geo = await geocodeAddress(query, {
      fallbackCentroid: opts.fallbackCentroid ? city : null,
    });

    if (!geo) {
      geocodeFailed++;
      console.warn(`[import-ayilaa] Géocodage échoué — skip id=${record.id} (${name})`);
      continue;
    }

    const photos = (record.images ?? []).filter(Boolean).slice(0, 20);

    await prisma.restaurant.upsert({
      where: { osmId },
      create: {
        osmId,
        name,
        description: record.description ?? null,
        address,
        city,
        lat: geo.lat,
        lng: geo.lng,
        cuisineType: inferCuisineType(record),
        priceRange: priceRangeFromXaf(record.prix_a_partir_de_xaf),
        avgRating: record.note_etoiles ?? 0,
        reviewCount: record.nb_avis_affiches ?? 0,
        photos,
        phone: record.telephone ?? null,
        website: record.url ?? null,
        status: 'published',
        source: 'AYILAA_IMPORT',
        osmTags: toOsmTags(record),
        lastSyncedAt: new Date(),
      },
      update: {
        name,
        description: record.description ?? null,
        address,
        city,
        lat: geo.lat,
        lng: geo.lng,
        cuisineType: inferCuisineType(record),
        priceRange: priceRangeFromXaf(record.prix_a_partir_de_xaf),
        avgRating: record.note_etoiles ?? 0,
        reviewCount: record.nb_avis_affiches ?? 0,
        photos,
        phone: record.telephone ?? null,
        website: record.url ?? null,
        status: 'published',
        source: 'AYILAA_IMPORT',
        osmTags: toOsmTags(record),
        lastSyncedAt: new Date(),
      },
    });

    imported++;

    if ((i + 1) % 50 === 0) {
      flushNominatimCache();
      console.log(`[import-ayilaa] Progression: ${i + 1}/${records.length} (${imported} importés)`);
    }
  }

  flushNominatimCache();

  const bySource = await prisma.restaurant.groupBy({
    by: ['source'],
    _count: { id: true },
  });

  console.log('\n[import-ayilaa] Terminé.');
  console.log(`  Importés : ${imported}`);
  console.log(`  Géocodage échoué (skip) : ${geocodeFailed}`);
  console.log('  Par source :', bySource);
}

main()
  .catch((err) => {
    console.error('[import-ayilaa] Erreur fatale:', err);
    process.exit(1);
  })
  .finally(async () => {
    flushNominatimCache();
    await prisma.$disconnect();
  });
