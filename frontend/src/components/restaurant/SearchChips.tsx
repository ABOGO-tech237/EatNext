import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import type { SearchParams } from '../../types';
import { isUsefulCuisine } from '../../lib/filters';
import { cn } from '../../lib/utils';
import { useSearchFilters } from '../../hooks/useRestaurants';

interface SearchChipsProps {
  params: SearchParams;
  onChange: (params: SearchParams) => void;
  onApply: (params: SearchParams) => void;
  onLocate: () => void;
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-200 hover:text-brand-700',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Chips ville / cuisine — valeurs issues de la base.
 */
export function SearchChips({ params, onChange, onApply, onLocate }: SearchChipsProps) {
  const { data } = useSearchFilters();
  const cities = data?.cities ?? [];
  const cuisines = (data?.cuisines ?? []).filter((c) => isUsefulCuisine(c.name));

  const apply = (patch: Partial<SearchParams>) => {
    const next = { ...params, ...patch };
    onChange(next);
    onApply(next);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {cities.map((c) => (
        <Chip
          key={`city-${c.name}`}
          active={params.city === c.name}
          onClick={() => apply({ city: params.city === c.name ? undefined : c.name })}
        >
          {c.name}
        </Chip>
      ))}
      {cuisines.map((c) => (
        <Chip
          key={`cuisine-${c.name}`}
          active={params.cuisine === c.name}
          onClick={() => apply({ cuisine: params.cuisine === c.name ? undefined : c.name })}
        >
          {c.name}
        </Chip>
      ))}
      <Chip active={params.lat != null} onClick={onLocate}>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          Près de moi
        </span>
      </Chip>
    </div>
  );
}
