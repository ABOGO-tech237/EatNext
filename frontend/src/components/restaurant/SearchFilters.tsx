import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { SearchParams } from '../../types';
import { CAMEROON_CITIES, CUISINE_CHIPS, PRICE_RANGE_TIERS } from '../../lib/utils';

interface SearchFiltersProps {
  params: SearchParams;
  onChange: (params: SearchParams) => void;
  onSearch: () => void;
  /** Masque la barre texte (chips déjà présents au-dessus). */
  compact?: boolean;
}

/**
 * Filtres avancés — cuisines unifiées avec la home.
 */
export function SearchFilters({ params, onChange, onSearch, compact }: SearchFiltersProps) {
  const update = (patch: Partial<SearchParams>) => onChange({ ...params, ...patch });

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-card">
      {!compact && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Rechercher"
              placeholder="Nom, cuisine, quartier…"
              value={params.q ?? ''}
              onChange={(e) => update({ q: e.target.value || undefined })}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
          </div>
          <Button onClick={onSearch} className="shrink-0 sm:mb-0 sm:self-end">
            <Search className="h-4 w-4" />
            Rechercher
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Ville</label>
          <select
            value={params.city ?? ''}
            onChange={(e) => update({ city: e.target.value || undefined })}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">Toutes</option>
            {CAMEROON_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Cuisine</label>
          <select
            value={params.cuisine ?? ''}
            onChange={(e) => update({ cuisine: e.target.value || undefined })}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm capitalize focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">Toutes</option>
            {CUISINE_CHIPS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Note min.</label>
          <select
            value={params.minRating ?? ''}
            onChange={(e) => update({ minRating: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">Toutes</option>
            {[4.5, 4, 3.5, 3].map((r) => (
              <option key={r} value={r}>
                {r}+ étoiles
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Budget</label>
          <select
            value={params.priceRange ?? ''}
            onChange={(e) => update({ priceRange: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">Tous</option>
            {PRICE_RANGE_TIERS.map((tier) => (
              <option key={tier.level} value={tier.level}>
                {tier.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-400">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Trier par</span>
        <select
          value={params.sortBy ?? 'rating'}
          onChange={(e) => update({ sortBy: e.target.value as SearchParams['sortBy'] })}
          className="rounded-lg border border-ink-200 px-2 py-1 text-xs"
        >
          <option value="rating">Meilleures notes</option>
          <option value="name">Nom</option>
          <option value="distance">Distance</option>
        </select>
        {compact && (
          <Button size="sm" className="ml-auto" onClick={onSearch}>
            Appliquer
          </Button>
        )}
      </div>
    </div>
  );
}
