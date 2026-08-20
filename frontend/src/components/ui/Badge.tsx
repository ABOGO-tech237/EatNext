import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'muted' | 'gold';
  className?: string;
}

/** Étiquette compacte pour cuisines, statuts, etc. */
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-ink-100 text-ink-700',
    brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    muted: 'bg-ink-50 text-ink-500',
    gold: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
