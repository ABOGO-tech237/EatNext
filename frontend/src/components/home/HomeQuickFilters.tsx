import { useNavigate } from 'react-router-dom';
import { FilterChip } from '../ui/FilterChip';
import { useSearchFilters } from '../../hooks/useRestaurants';
import { pickHomeCities, pickHomeCuisines } from '../../lib/filters';
import { PRICE_RANGE_TIERS } from '../../lib/utils';
import { searchParamsToQuery } from '../../lib/searchQuery';
import type { SearchParams } from '../../types';

/**
 * Filtres rapides accueil : zone, prix FCFA, cuisine (3), ouvert maintenant.
 */
export function HomeQuickFilters() {
  const navigate = useNavigate();
  const { data } = useSearchFilters();
  const cities = pickHomeCities(data?.cities ?? []);
  const cuisines = pickHomeCuisines(data?.cuisines ?? []);

  const go = (params: SearchParams) => {
    navigate(`/search?${searchParamsToQuery(params)}`);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6" aria-label="Filtres rapides">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cities.map((c) => (
          <FilterChip key={c.name} onClick={() => go({ city: c.name })}>
            {c.name}
          </FilterChip>
        ))}
        {PRICE_RANGE_TIERS.map((tier) => (
          <FilterChip key={tier.level} onClick={() => go({ priceRange: tier.level })}>
            {tier.short}
          </FilterChip>
        ))}
        {cuisines.map((c) => (
          <FilterChip key={c.name} onClick={() => go({ cuisine: c.name })}>
            {c.name}
          </FilterChip>
        ))}
        <FilterChip onClick={() => go({ openNow: true })}>Ouvert maintenant</FilterChip>
      </div>
    </section>
  );
}
