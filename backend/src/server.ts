import { createApp } from './app.js';
import { env } from './config/env.js';
import { redis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';

async function main() {
  try {
    await redis.connect();
    console.log('Redis connected');
  } catch {
    console.warn('Redis unavailable — cache disabled');
  }

  await prisma.$connect();
  console.log('Database connected');

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`EatNext API running on http://localhost:${env.port}`);
    console.log(`API base: http://localhost:${env.port}/v1`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
