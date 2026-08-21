import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: ReactNode;
}

/**
 * Chip filtre — Material 3 Filter chip, retravaillé en forêt EatNext.
 * Sélection = fond brand + check, comme le kit M3 (checkmark leading).
 */
export function FilterChip({ selected, children, className, type = 'button', ...props }: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'border-brand-800 bg-brand-800 text-white'
          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-800',
        className,
      )}
      {...props}
    >
      {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </button>
  );
}
