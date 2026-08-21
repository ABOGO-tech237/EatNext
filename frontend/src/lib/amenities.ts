import { isUsefulCuisine } from './filters';
import { openingStatus } from './utils';
import type { Restaurant } from '../types';

/** Correspondances OSM → libellés EatNext. Un badge n’apparaît que si le tag est vraiment `yes`. */
const OSM_AMENITY_TAGS: { keys: string[]; label: string }[] = [
  { keys: ['outdoor_seating'], label: 'Terrasse' },
  { keys: ['delivery'], label: 'Livraison' },
  { keys: ['takeaway'], label: 'À emporter' },
  { keys: ['wheelchair'], label: 'Accessible' },
  { keys: ['air_conditioning'], label: 'Climatisé' },
];

function tagYes(tags: Record<string, string>, key: string): boolean {
  const value = tags[key]?.trim().toLowerCase();
  return value === 'yes' || value === 'true' || value === '1';
}

/** Badges issus uniquement des tags OSM présents — jamais inventés. */
export function amenitiesFromTags(tags?: Record<string, string> | null): string[] {
  if (!tags) return [];
  return OSM_AMENITY_TAGS.filter((rule) => rule.keys.some((key) => tagYes(tags, key))).map(
    (rule) => rule.label,
  );
}

export function restaurantAmenities(restaurant: Restaurant): string[] {
  return amenitiesFromTags(restaurant.osmTags);
}

/** Premier signal distinctif : amenity OSM, sinon cuisine utile. */
export function distinctiveTag(restaurant: Restaurant): string | null {
  const amenities = restaurantAmenities(restaurant);
  if (amenities[0]) return amenities[0];
  if (isUsefulCuisine(restaurant.cuisineType)) return restaurant.cuisineType;
  return null;
}

const NEW_MS = 30 * 24 * 60 * 60 * 1000;

/** Badge « Nouveau » seulement si `createdAt` API est dans les 30 derniers jours. */
export function isRecentlyListed(restaurant: Restaurant, now = Date.now()): boolean {
  if (!restaurant.createdAt) return false;
  const at = Date.parse(restaurant.createdAt);
  if (Number.isNaN(at)) return false;
  return now - at < NEW_MS;
}

export function isOpenNow(restaurant: Restaurant): boolean {
  return openingStatus(restaurant.openingHours)?.open === true;
}
