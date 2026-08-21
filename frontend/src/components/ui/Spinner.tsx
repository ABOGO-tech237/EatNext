import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Indicateur de chargement centré — utilisé dans les listes et pages. */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

  return (
    <div className={cn('flex items-center justify-center py-12', className)} role="status">
      <div
        className={cn(
          'animate-spin rounded-full border-[3px] border-ink-200 border-t-brand-600',
          sizes[size],
        )}
      />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

/** Grille de cartes skeleton pendant le chargement initial. */
export function RestaurantGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <RestaurantCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RestaurantCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'rail' | 'list' }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div
        className={cn(
          'shimmer',
          variant === 'rail' && 'aspect-[4/5]',
          variant === 'list' && 'aspect-[16/10] sm:h-44',
          variant === 'grid' && 'aspect-[4/3]',
        )}
      />
      <div className="space-y-3 p-4">
        <div className="shimmer h-5 w-3/4 rounded" />
        <div className="shimmer h-4 w-1/2 rounded" />
        <div className="shimmer h-4 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function RestaurantRailSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden px-4 sm:px-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-[min(80vw,17.5rem)] shrink-0">
          <RestaurantCardSkeleton variant="rail" />
        </div>
      ))}
    </div>
  );
}

export function RestaurantListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <RestaurantCardSkeleton key={i} variant="list" />
      ))}
    </div>
  );
}
