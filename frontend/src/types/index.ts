/** Types alignés sur l'API backend EatNext (incl. champs OSM). */

export type RestaurantSource = 'USER_SUBMITTED' | 'OSM_SYNC';

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
  /** Distance en mètres — recherche géographique. */
  distance?: number;
}

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  source?: string;
  osmCount?: number;
  dbCount?: number;
}

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
