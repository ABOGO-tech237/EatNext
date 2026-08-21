import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne les classes Tailwind en évitant les conflits. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Paliers de prix affichés en FCFA (XAF) — jamais d'euros. */
export const PRICE_RANGE_TIERS = [
  { level: 1, label: 'Moins de 5 000 FCFA', short: '≤ 5 000 F', symbol: 'F' },
  { level: 2, label: '5 000 – 10 000 FCFA', short: '5–10k F', symbol: 'FF' },
  { level: 3, label: '10 000 – 20 000 FCFA', short: '10–20k F', symbol: 'FFF' },
  { level: 4, label: 'Plus de 20 000 FCFA', short: '≥ 20 000 F', symbol: 'FFFF' },
] as const;

/** Formate un montant unitaire en FCFA (ex. 3 500 FCFA). */
export function formatPrice(amount: number): string {
  const formatted = Math.round(amount).toLocaleString('fr-FR').replace(/\u202f/g, ' ');
  return `${formatted} FCFA`;
}

/** Fourchette qualitative 1–4 en FCFA. */
export function formatPriceRange(range: number): string {
  const tier = PRICE_RANGE_TIERS.find((t) => t.level === range) ?? PRICE_RANGE_TIERS[1];
  return tier.short;
}

/** Libellé long de la fourchette (filtres, fiche). */
export function formatPriceRangeLabel(range: number): string {
  const tier = PRICE_RANGE_TIERS.find((t) => t.level === range) ?? PRICE_RANGE_TIERS[1];
  return tier.label;
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

export const CAMEROON_CITIES = [
  { name: 'Yaoundé', lat: 3.8667, lng: 11.5167 },
  { name: 'Douala', lat: 4.0511, lng: 9.7679 },
] as const;

/** Dernier segment d’adresse (Bastos, Akwa) — ignore la ville si elle est en suffixe. */
export function neighborhoodFromAddress(address?: string | null): string | null {
  if (!address) return null;
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  const cityNames = CAMEROON_CITIES.map((c) => c.name);
  if (cityNames.includes(last as (typeof cityNames)[number])) {
    return parts.length > 1 ? parts[parts.length - 2] : null;
  }
  return last;
}

/** Première phrase d’une description (extrait carte). */
export function firstSentence(text?: string | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  return match?.[0]?.trim() || trimmed;
}

export type OpeningStatus = { open: boolean; label: string };

const OSM_DAY_ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const WEEKDAY_TO_OSM: Record<string, (typeof OSM_DAY_ORDER)[number]> = {
  Sun: 'Su',
  Mon: 'Mo',
  Tue: 'Tu',
  Wed: 'We',
  Thu: 'Th',
  Fri: 'Fr',
  Sat: 'Sa',
};

/** Heure locale Douala / Yaoundé — pas l’horloge UTC du serveur. */
function cameroonClock(now = new Date()): { day: (typeof OSM_DAY_ORDER)[number]; mins: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Douala',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { day: WEEKDAY_TO_OSM[weekday] ?? 'Mo', mins: hour * 60 + minute };
}

/**
 * Parseur conservateur : `Mo-Su 11:00-23:00` (pas de plage nuit, pas de multi-règles).
 */
export function openingStatus(hours?: string | null): OpeningStatus | null {
  if (!hours) return null;
  const match = hours
    .trim()
    .match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const startDay = match[1] as (typeof OSM_DAY_ORDER)[number];
  const endDay = (match[2] ?? match[1]) as (typeof OSM_DAY_ORDER)[number];
  const startMin = Number(match[3]) * 60 + Number(match[4]);
  const endMin = Number(match[5]) * 60 + Number(match[6]);
  if (endMin <= startMin) return null;

  const startIdx = OSM_DAY_ORDER.indexOf(startDay);
  const endIdx = OSM_DAY_ORDER.indexOf(endDay);
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return null;

  const days = new Set(OSM_DAY_ORDER.slice(startIdx, endIdx + 1));
  const { day, mins } = cameroonClock();
  const open = days.has(day) && mins >= startMin && mins < endMin;
  return { open, label: open ? 'Ouvert' : 'Fermé' };
}

/** Lien itinéraire Google Maps. */
export function mapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
