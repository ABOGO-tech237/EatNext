import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne les classes Tailwind en évitant les conflits (pattern shadcn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Niveaux de budget restaurant (1–4) avec fourchettes indicatives en FCFA. */
export const PRICE_RANGE_TIERS = [
  { level: 1, label: 'Économique', short: '< 3k F', full: 'Moins de 3 000 FCFA' },
  { level: 2, label: 'Modéré', short: '3–8k F', full: '3 000 – 8 000 FCFA' },
  { level: 3, label: 'Élevé', short: '8–20k F', full: '8 000 – 20 000 FCFA' },
  { level: 4, label: 'Premium', short: '20k+ F', full: 'Plus de 20 000 FCFA' },
] as const;

const priceFormatter = new Intl.NumberFormat('fr-CM', {
  style: 'currency',
  currency: 'XAF',
  maximumFractionDigits: 0,
});

/** Montant en franc CFA (FCFA / XAF). */
export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

export function getPriceRangeTier(range: number) {
  const level = Math.min(Math.max(Math.round(range), 1), 4);
  return PRICE_RANGE_TIERS.find((t) => t.level === level) ?? PRICE_RANGE_TIERS[1];
}

/** Libellé complet de la fourchette de prix (accessibilité, filtres). */
export function formatPriceRange(range: number): string {
  return getPriceRangeTier(range).full;
}

/** Libellé court pour les cartes et listes. */
export function formatPriceRangeShort(range: number): string {
  return getPriceRangeTier(range).short;
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

/** POI OSM non encore persisté en base (id synthétique osm-*). */
export function isOsmEphemeral(restaurant: { id: string }): boolean {
  return restaurant.id.startsWith('osm-');
}

/** Restaurant avec UUID EatNext en PostgreSQL. */
export function isPersistedInDb(restaurant: { id: string }): boolean {
  return !restaurant.id.startsWith('osm-');
}

/** Lien fiche : sync OSM via API si éphémère, sinon fiche locale. */
export function restaurantDetailPath(restaurant: {
  id: string;
  osmType?: string | null;
  osmId?: string | null;
}): string {
  if (isPersistedInDb(restaurant)) return `/restaurants/${restaurant.id}`;
  if (restaurant.osmType && restaurant.osmId) {
    return `/osm/${restaurant.osmType}/${restaurant.osmId}`;
  }
  return `/restaurants/${restaurant.id}`;
}

/** Image par défaut lorsqu'aucune photo n'est disponible en base. */
export const DEFAULT_RESTAURANT_PHOTO =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';

/** Photo principale : données API ou placeholder par défaut. */
export function restaurantPhotoUrl(restaurant: { photos?: string[] }): string {
  const photo = restaurant.photos?.[0];
  if (photo && !photo.includes('staticmap.openstreetmap.de')) return photo;
  return DEFAULT_RESTAURANT_PHOTO;
}
