import type { Favorite, Restaurant, Review, User } from '../types';

/**
 * Données de démonstration locales — utilisées quand l'API est indisponible.
 * Reprend les restaurants du seed backend (Yaoundé / Douala).
 */
export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'mock-1',
    name: 'Le Biniou',
    description:
      'Cuisine camerounaise authentique — ndolé, poulet DG et poisson braisé dans une ambiance conviviale.',
    address: 'Avenue Kennedy, Bastos',
    city: 'Yaoundé',
    lat: 3.8667,
    lng: 11.5167,
    cuisineType: 'camerounaise',
    priceRange: 2,
    avgRating: 4.5,
    reviewCount: 128,
    photos: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    ],
    openingHours: 'Mo-Su 11:00-23:00',
    status: 'published',
  },
  {
    id: 'mock-2',
    name: 'La Fourchette Dorée',
    description:
      "Brasserie moderne au cœur d'Akwa — spécialités franco-africaines et cocktails maison.",
    address: 'Boulevard de la Liberté, Akwa',
    city: 'Douala',
    lat: 4.0511,
    lng: 9.7679,
    cuisineType: 'franco-africaine',
    priceRange: 3,
    avgRating: 4.3,
    reviewCount: 94,
    photos: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    ],
    openingHours: 'Mo-Su 12:00-23:00',
    status: 'published',
  },
  {
    id: 'mock-3',
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
    photos: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    ],
    openingHours: 'Mo-Su 10:00-22:00',
    status: 'published',
  },
  {
    id: 'mock-4',
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
    photos: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    ],
    openingHours: 'Mo-Su 11:00-22:00',
    status: 'published',
  },
  {
    id: 'mock-5',
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
    photos: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
    ],
    openingHours: 'Mo-Su 12:00-23:00',
    status: 'published',
  },
  {
    id: 'mock-6',
    name: 'Suya Spot',
    description:
      'Le meilleur suya de Douala — viande épicée grillée à la perfection, ambiance street food premium.',
    address: 'Bonapriso',
    city: 'Douala',
    lat: 4.0612,
    lng: 9.7234,
    cuisineType: 'nigériane',
    priceRange: 1,
    avgRating: 4.8,
    reviewCount: 312,
    photos: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    ],
    openingHours: 'Mo-Su 11:00-23:00',
    status: 'published',
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    rating: 5,
    content: 'Excellent ndolé, portions généreuses. Service rapide malgré l\'affluence du samedi.',
    createdAt: '2025-11-12T18:30:00Z',
    user: { id: 'u1', fullName: 'Marie K.' },
  },
  {
    id: 'rev-2',
    rating: 4,
    content: 'Ambiance chaleureuse, un peu bruyant le soir mais la cuisine compense largement.',
    createdAt: '2025-10-28T20:15:00Z',
    user: { id: 'u2', fullName: 'Jean-Paul M.' },
  },
  {
    id: 'rev-3',
    rating: 5,
    content: 'Mon adresse préférée à Yaoundé. Le poulet DG est tout simplement parfait.',
    createdAt: '2025-09-05T12:00:00Z',
    user: { id: 'u3', fullName: 'Aïcha B.' },
  },
];

export const MOCK_USER: User = {
  id: 'mock-user',
  email: 'demo@eatnext.cm',
  fullName: 'Utilisateur Démo',
  role: 'user',
  isVerified: true,
};

/** Favoris persistés localement en mode mock (clé localStorage). */
export const MOCK_FAVORITES_KEY = 'eatnext_mock_favorites';

export function getMockFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(MOCK_FAVORITES_KEY);
    if (!raw) return [];
    const ids: string[] = JSON.parse(raw);
    return ids
      .map((id) => {
        const restaurant = MOCK_RESTAURANTS.find((r) => r.id === id);
        if (!restaurant) return null;
        return {
          id: `fav-${id}`,
          restaurantId: id,
          restaurant,
          createdAt: new Date().toISOString(),
        };
      })
      .filter(Boolean) as Favorite[];
  } catch {
    return [];
  }
}

export function toggleMockFavorite(restaurantId: string): boolean {
  const ids = getMockFavorites().map((f) => f.restaurantId);
  const exists = ids.includes(restaurantId);
  const next = exists ? ids.filter((id) => id !== restaurantId) : [...ids, restaurantId];
  localStorage.setItem(MOCK_FAVORITES_KEY, JSON.stringify(next));
  return !exists;
}

export function isMockFavorite(restaurantId: string): boolean {
  return getMockFavorites().some((f) => f.restaurantId === restaurantId);
}

/** Filtre local simulant l'endpoint de recherche backend. */
export function searchMockRestaurants(params: {
  q?: string;
  city?: string;
  cuisine?: string;
  minRating?: number;
  priceRange?: number;
}): Restaurant[] {
  let results = [...MOCK_RESTAURANTS];

  if (params.q) {
    const q = params.q.toLowerCase();
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.cuisineType.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q),
    );
  }
  if (params.city) {
    results = results.filter((r) => r.city.toLowerCase() === params.city!.toLowerCase());
  }
  if (params.cuisine) {
    results = results.filter((r) => r.cuisineType.toLowerCase() === params.cuisine!.toLowerCase());
  }
  if (params.minRating) {
    results = results.filter((r) => r.avgRating >= params.minRating!);
  }
  if (params.priceRange) {
    results = results.filter((r) => r.priceRange === params.priceRange);
  }

  return results;
}
