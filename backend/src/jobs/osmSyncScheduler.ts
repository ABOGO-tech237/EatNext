import { env } from '../config/env.js';
import { resyncAllZones } from '../services/osmBootstrap.service.js';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

async function tick() {
  if (running) {
    console.warn('[osm-sync] Previous sync still running — skipping');
    return;
  }

  running = true;
  try {
    console.log('[osm-sync] Scheduled resync starting…');
    const result = await resyncAllZones();
    console.log(`[osm-sync] Done — ${result.totalSynced} restaurant(s) upserted`);
  } catch (err) {
    console.error('[osm-sync] Scheduled resync failed:', err);
  } finally {
    running = false;
  }
}

/** Lance la resynchronisation OSM périodique (Overpass → PostgreSQL). */
export function startOsmSyncScheduler() {
  if (!env.osmSyncIntervalHours || env.osmSyncIntervalHours <= 0) return;

  const ms = env.osmSyncIntervalHours * 60 * 60 * 1000;
  timer = setInterval(tick, ms);
  console.log(`[osm-sync] Scheduler every ${env.osmSyncIntervalHours}h`);
}

export function stopOsmSyncScheduler() {
  if (timer) clearInterval(timer);
}
