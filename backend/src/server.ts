import { createApp } from './app.js';
import { env } from './config/env.js';
import { redis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';
import { bootstrapAllZones } from './services/osmBootstrap.service.js';
import { startOsmSyncScheduler } from './jobs/osmSyncScheduler.js';

async function main() {
  try {
    await redis.connect();
    console.log('Redis connected');
  } catch {
    console.warn('Redis unavailable — cache disabled');
  }

  await prisma.$connect();
  console.log('Database connected');

  if (env.osmSyncOnStart) {
    try {
      const result = await bootstrapAllZones({
        purge: env.osmPurgeNonOsm,
      });
      console.log(
        `[startup] OSM sync: ${result.totalSynced} restaurant(s) (${result.purged} purged)`,
      );
    } catch (err) {
      console.warn('[startup] OSM sync skipped (Overpass unavailable?):', err);
    }
  }

  startOsmSyncScheduler();

  const app = createApp();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`EatNext API running on http://0.0.0.0:${env.port}`);
    console.log(`API base: http://localhost:${env.port}/v1`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
