import { BadgeCheck, Database, ShieldQuestion } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Restaurant } from '../../types';

export type ListingBadge = 'official' | 'osm' | 'unverified';

export function getListingBadge(restaurant: Pick<Restaurant, 'ownerId' | 'source' | 'status'>): ListingBadge {
  if (restaurant.ownerId) return 'official';
  if (restaurant.source === 'OSM_SYNC' || restaurant.source === 'AYILAA_IMPORT') return 'osm';
  return 'unverified';
}

const COPY: Record<ListingBadge, { label: string; icon: typeof BadgeCheck; className: string }> = {
  official: {
    label: 'Fiche officielle',
    icon: BadgeCheck,
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  osm: {
    label: 'Données OSM',
    icon: Database,
    className: 'bg-ink-800 text-white ring-1 ring-ink-700',
  },
  unverified: {
    label: 'Non vérifié',
    icon: ShieldQuestion,
    className: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  },
};

export function SourceBadge({
  restaurant,
  className,
}: {
  restaurant: Pick<Restaurant, 'ownerId' | 'source' | 'status'>;
  className?: string;
}) {
  const kind = getListingBadge(restaurant);
  const { label, icon: Icon, className: tone } = COPY[kind];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide',
        tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
