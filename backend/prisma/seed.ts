import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed minimal : compte admin uniquement.
 * Restaurants : npm run db:import-ayilaa (Ayilaa JSONL) ou npm run db:bootstrap (OSM).
 */
async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@eatnext.africa' },
    update: {},
    create: {
      email: 'admin@eatnext.africa',
      fullName: 'Admin EatNext',
      passwordHash,
      role: 'admin',
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'marie@example.com' },
    update: {},
    create: {
      email: 'marie@example.com',
      fullName: 'Marie Kouassi',
      passwordHash,
      role: 'user',
      isVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'owner@eatnext.africa' },
    update: {},
    create: {
      email: 'owner@eatnext.africa',
      fullName: 'Jean Mbarga',
      passwordHash,
      role: 'owner',
      isVerified: true,
    },
  });

  console.log('Seed complete (comptes de test).');
  console.log('Admin: admin@eatnext.africa / Password123!');
  console.log('User:  marie@example.com / Password123!');
  console.log('Owner: owner@eatnext.africa / Password123!');
  console.log('Restaurants Ayilaa: npm run db:import-ayilaa -- --fallback-centroid');
  console.log('Restaurants OSM:     npm run db:bootstrap');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
