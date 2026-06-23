/**
 * Cron Vercel — resynchronisation OSM → PostgreSQL (toutes les 24 h).
 * Protégé par CRON_SECRET (en-tête Authorization: Bearer …).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../src/lib/prisma.js';
import { resyncAllZones } from '../../src/services/osmBootstrap.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization;

  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await prisma.$connect();
    const result = await resyncAllZones();
    return res.status(200).json({
      success: true,
      data: { totalSynced: result.totalSynced, zones: result.zones.length },
    });
  } catch (err) {
    console.error('[cron/osm-sync]', err);
    return res.status(500).json({ success: false, error: 'OSM sync failed' });
  }
}
