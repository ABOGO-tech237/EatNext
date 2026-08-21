import { HomeSearchBar } from './HomeSearchBar';
import { pickHomeCities } from '../../lib/filters';
import { useSearchFilters } from '../../hooks/useRestaurants';

/**
 * Bandeau compact sous le header : recherche + intention, pas un hero plein écran.
 */
export function HomeDiscoverHeader() {
  const { data } = useSearchFilters();
  const cities = pickHomeCities(data?.cities ?? []).map((c) => c.name);

  return (
    <section className="bg-brand-800 px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {cities.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-500">
            {cities.join(' · ')}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Où manger ce soir ?
        </h1>
        <p className="mt-2 max-w-lg text-sm text-white/75">
          Tables, notes et avis au Cameroun — prix en FCFA.
        </p>
        <div className="mt-5 text-ink-900">
          <HomeSearchBar delay={0} />
        </div>
      </div>
    </section>
  );
}
