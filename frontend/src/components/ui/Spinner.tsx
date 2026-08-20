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
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-card">
          <div className="shimmer aspect-[4/3]" />
          <div className="space-y-3 p-4">
            <div className="shimmer h-5 w-3/4 rounded" />
            <div className="shimmer h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
