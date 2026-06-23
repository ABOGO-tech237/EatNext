import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed minimal : compte admin uniquement.
 * Les restaurants viennent d'OpenStreetMap (npm run db:bootstrap ou sync au démarrage).
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

  console.log('Seed complete (admin account only).');
  console.log('Admin: admin@eatnext.africa / Password123!');
  console.log('Restaurants: run npm run db:bootstrap (OpenStreetMap → PostgreSQL)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
