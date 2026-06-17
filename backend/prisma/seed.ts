import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const RESTAURANTS = [
  {
    name: 'Le Biniou',
    description: 'Cuisine camerounaise authentique — ndolé, poulet DG et poisson braisé dans une ambiance conviviale.',
    address: 'Avenue Kennedy, Bastos',
    city: 'Yaoundé',
    lat: 3.8667,
    lng: 11.5167,
    cuisineType: 'camerounaise',
    priceRange: 2,
    avgRating: 4.5,
    reviewCount: 128,
    photos: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'],
    status: 'published' as const,
  },
  {
    name: 'La Fourchette Dorée',
    description: 'Brasserie moderne au cœur d\'Akwa — spécialités franco-africaines et cocktails maison.',
    address: 'Boulevard de la Liberté, Akwa',
    city: 'Douala',
    lat: 4.0511,
    lng: 9.7679,
    cuisineType: 'franco-africaine',
    priceRange: 3,
    avgRating: 4.3,
    reviewCount: 94,
    photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
    status: 'published' as const,
  },
  {
    name: 'Chez Tantine',
    description: 'Maquis populaire réputé pour son eru et ses brochettes de bœuf. Ouvert tard le soir.',
    address: 'Quartier Mvog-Ada',
    city: 'Yaoundé',
    lat: 3.848,
    lng: 11.5021,
    cuisineType: 'camerounaise',
    priceRange: 1,
    avgRating: 4.7,
    reviewCount: 203,
    photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
    status: 'published' as const,
  },
  {
    name: 'Mama Africa Kitchen',
    description: 'Fusion ouest-africaine — thiéboudienne, mafé et attiéké dans un cadre chaleureux.',
    address: 'Rue Joss, Bonanjo',
    city: 'Douala',
    lat: 4.0435,
    lng: 9.7043,
    cuisineType: 'ouest-africaine',
    priceRange: 2,
    avgRating: 4.1,
    reviewCount: 67,
    photos: ['https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800'],
    status: 'published' as const,
  },
  {
    name: 'Le Patio',
    description: 'Terrasse ombragée avec vue sur le Mont Fébé. Cuisine méditerranéenne et grillades.',
    address: 'Mont Fébé, Yaoundé',
    city: 'Yaoundé',
    lat: 3.8892,
    lng: 11.4895,
    cuisineType: 'méditerranéenne',
    priceRange: 3,
    avgRating: 4.6,
    reviewCount: 85,
    photos: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'],
    status: 'published' as const,
  },
  {
    name: 'Suya Spot',
    description: 'Le meilleur suya de Douala — viande épicée grillée à la perfection, ambiance street food premium.',
    address: 'Bonapriso',
    city: 'Douala',
    lat: 4.0612,
    lng: 9.7234,
    cuisineType: 'nigériane',
    priceRange: 1,
    avgRating: 4.8,
    reviewCount: 312,
    photos: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'],
    status: 'published' as const,
  },
  {
    name: 'Le Ndolé Palace',
    description: 'Restaurant haut de gamme spécialisé dans la gastronomie camerounaise revisitée.',
    address: 'Odza, Yaoundé',
    city: 'Yaoundé',
    lat: 3.8356,
    lng: 11.5412,
    cuisineType: 'camerounaise',
    priceRange: 4,
    avgRating: 4.4,
    reviewCount: 56,
    photos: ['https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800'],
    status: 'published' as const,
  },
  {
    name: 'Ocean View',
    description: 'Fruits de mer frais face à l\'océan Atlantique. Crevettes, langouste et poisson du jour.',
    address: 'Limbe Beach Road',
    city: 'Limbe',
    lat: 4.0225,
    lng: 9.2065,
    cuisineType: 'fruits de mer',
    priceRange: 3,
    avgRating: 4.2,
    reviewCount: 78,
    photos: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'],
    status: 'published' as const,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
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

  const demo = await prisma.user.upsert({
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

  const owner = await prisma.user.upsert({
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

  for (const [i, r] of RESTAURANTS.entries()) {
    const existing = await prisma.restaurant.findFirst({ where: { name: r.name, city: r.city } });
    if (existing) continue;

    const restaurant = await prisma.restaurant.create({
      data: {
        ...r,
        ownerId: i % 2 === 0 ? owner.id : undefined,
      },
    });

    await prisma.review.create({
      data: {
        userId: demo.id,
        restaurantId: restaurant.id,
        rating: Math.min(5, Math.max(3, Math.round(r.avgRating))),
        content: `Excellent repas chez ${r.name} ! Je recommande vivement.`,
      },
    });
  }

  console.log('Seed complete.');
  console.log('Admin: admin@eatnext.africa / Password123!');
  console.log('User:  marie@example.com / Password123!');
  console.log('Owner: owner@eatnext.africa / Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
