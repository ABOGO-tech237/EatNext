import { formatPriceRange } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface PriceRangeProps {
  range: number;
  className?: string;
}

/** Affiche la fourchette de prix avec symboles € actifs/inactifs. */
export function PriceRange({ range, className }: PriceRangeProps) {
  const max = 4;
  return (
    <span className={cn('text-sm font-medium', className)} aria-label={`Prix : ${formatPriceRange(range)}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < range ? 'text-ink-800' : 'text-ink-300'}>
          €
        </span>
      ))}
    </span>
  );
}
