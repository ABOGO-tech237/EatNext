import { Star } from 'lucide-react';
import { cn, formatRating } from '../../lib/utils';

interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
  className?: string;
}

/**
 * Affichage de la note moyenne avec étoiles pleines/demi/vides.
 * Style compact — étoiles ambre, texte forêt.
 */
export function Rating({ value, count, size = 'md', showValue = true, className }: RatingProps) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = value >= i + 1;
          const half = !filled && value >= i + 0.5;
          return (
            <Star
              key={i}
              className={cn(
                starSize,
                filled || half ? 'fill-amber-400 text-amber-400' : 'fill-ink-200 text-ink-200',
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className={cn('font-semibold text-ink-900', size === 'sm' ? 'text-sm' : 'text-base')}>
          {formatRating(value)}
        </span>
      )}
      {count != null && count > 0 && (
        <span className="text-sm text-ink-500">({count} avis)</span>
      )}
    </div>
  );
}

/** Sélecteur interactif de note (1 à 5 étoiles) pour les formulaires d'avis. */
export function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                'h-8 w-8',
                value >= star ? 'fill-amber-400 text-amber-400' : 'text-ink-300',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
