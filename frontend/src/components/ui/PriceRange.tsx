import {
  formatPriceRange,
  formatPriceRangeShort,
  getPriceRangeTier,
  PRICE_RANGE_TIERS,
} from '../../lib/utils';
import { cn } from '../../lib/utils';

interface PriceRangeProps {
  range: number;
  className?: string;
}

/** Affiche la fourchette de budget avec indicateur visuel et montant FCFA. */
export function PriceRange({ range, className }: PriceRangeProps) {
  const tier = getPriceRangeTier(range);

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-sm font-medium', className)}
      aria-label={`Prix : ${formatPriceRange(range)}`}
      title={tier.full}
    >
      <span className="inline-flex gap-0.5" aria-hidden>
        {PRICE_RANGE_TIERS.map(({ level }) => (
          <span
            key={level}
            className={cn(
              'h-1.5 w-1.5 rounded-full bg-current',
              level <= tier.level ? 'opacity-90' : 'opacity-25',
            )}
          />
        ))}
      </span>
      <span className="text-xs">{formatPriceRangeShort(range)}</span>
    </span>
  );
}
