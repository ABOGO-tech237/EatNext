import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne les classes Tailwind en évitant les conflits (pattern shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Affiche une fourchette de prix sous forme de symboles € (style TheFork). */
export function formatPriceRange(range: number): string {
  return '€'.repeat(Math.min(Math.max(range, 1), 4));
}

/** Formate une note sur 5 avec une décimale. */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Distance lisible : mètres ou kilomètres selon l'amplitude. */
export function formatDistance(meters?: number): string | null {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
