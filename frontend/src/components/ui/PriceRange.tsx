import { formatPriceRange, formatPriceRangeLabel } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface PriceRangeProps {
  range: number;
  className?: string;
}

/** Affiche la fourchette de prix en FCFA (jamais d'euros). */
export function PriceRange({ range, className }: PriceRangeProps) {
  return (
    <span
      className={cn('text-xs font-semibold tracking-wide text-ink-600', className)}
      aria-label={`Prix : ${formatPriceRangeLabel(range)}`}
    >
      {formatPriceRange(range)}
    </span>
  );
}
