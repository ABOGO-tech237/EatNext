/** Types partagés alignés sur le schéma Prisma / l'API backend EatNext. */

export type UserRole = 'user' | 'owner' | 'admin';
export type RestaurantSource = 'USER_SUBMITTED' | 'OSM_SYNC';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  lat: number;
  lng: number;
  cuisineType: string;
  priceRange: number;
  avgRating: number;
  reviewCount: number;
  photos: string[];
  status?: string;
  source?: RestaurantSource;
  osmId?: string | null;
  osmType?: string | null;
  osmTags?: Record<string, string> | null;
  openingHours?: string | null;
  phone?: string | null;
  website?: string | null;
  owner?: { id: string; fullName: string; email?: string } | null;
  /** Distance en mètres — renvoyée par la recherche géographique. */
  distance?: number;
}

export interface Review {
  id: string;
  rating: number;
  content?: string | null;
  photos?: string[];
  ownerReply?: string | null;
  createdAt: string;
  user?: { id: string; fullName: string };
}

export interface Favorite {
  id: string;
  restaurantId: string;
  restaurant: Restaurant;
  createdAt: string;
  listId?: string | null;
}

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  source?: string;
  osmCount?: number;
  dbCount?: number;
}

/** Enveloppe standard des réponses API EatNext. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface SearchParams {
  q?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  cuisine?: string;
  minRating?: number;
  priceRange?: number;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'distance' | 'name';
  order?: 'asc' | 'desc';
  includeOsm?: boolean;
}
