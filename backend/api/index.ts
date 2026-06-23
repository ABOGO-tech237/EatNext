/**
 * Point d'entrée serverless Vercel pour l'API Express EatNext.
 * Initialise Prisma (et Redis si disponible) au cold start, puis délègue à createApp().
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

type ExpressApp = ReturnType<typeof createApp>;

let app: ExpressApp | undefined;

async function getApp(): Promise<ExpressApp> {
  if (app) return app;

  try {
    await redis.connect();
  } catch {
    console.warn('[vercel] Redis unavailable — cache disabled');
  }

  await prisma.$connect();
  app = createApp();
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp();
  return expressApp(req, res);
}
