import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { SearchFilters } from '../components/restaurant/SearchFilters';
import { SearchChips } from '../components/restaurant/SearchChips';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { RestaurantMap } from '../components/restaurant/RestaurantMap';
import { RestaurantGridSkeleton } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { useRestaurantSearch, useSearchFilters } from '../hooks/useRestaurants';
import { useIsFavorite, useToggleFavorite } from '../hooks/useFavorites';
import { useIsAuthenticated } from '../stores/authStore';
import type { Restaurant, SearchParams } from '../types';
import { CAMEROON_CITIES, cn } from '../lib/utils';
import { queryToSearchParams, searchParamsToQuery } from '../lib/searchQuery';

/**
 * Recherche : barre texte toujours visible + filtres issus de la base.
 */
export default function SearchPage() {
  const [urlParams, setUrlParams] = useSearchParams();
  const isAuth = useIsAuthenticated();
  const toggleFavorite = useToggleFavorite();
  const { data: filters } = useSearchFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapTall, setMapTall] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const params = useMemo(() => queryToSearchParams(urlParams), [urlParams]);
  const [draft, setDraft] = useState<SearchParams>(params);

  useEffect(() => {
    setDraft(params);
  }, [params]);

  const apply = (next: SearchParams) => {
    setDraft(next);
    setUrlParams(searchParamsToQuery(next), { replace: true });
  };

  const { data, isLoading, isFetching } = useRestaurantSearch(params);
  const restaurants = data?.items ?? [];

  const defaultCity =
    filters?.cities.find((c) => c.name === params.city) ??
    filters?.cities[0] ??
    CAMEROON_CITIES[0];
  const mapCenter: [number, number] = selected
    ? [selected.lat, selected.lng]
    : params.lat != null && params.lng != null
      ? [params.lat, params.lng]
      : [defaultCity.lat, defaultCity.lng];

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      apply({
        ...params,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        radius: 5000,
        sortBy: 'distance',
      });
    });
  };

  const onSelectFromList = (r: Restaurant) => setSelected(r);

  const onSelectFromMap = (r: Restaurant) => {
    setSelected(r);
    document
      .querySelector(`[data-restaurant-id="${r.id}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const mapNode = (
    <RestaurantMap
      restaurants={restaurants}
      center={mapCenter}
      selectedId={selected?.id}
      onSelect={onSelectFromMap}
      height="100%"
      layoutTick={`${mapOpen}-${mapTall}`}
    />
  );

  return (
    <div className="bg-ink-50">
      <div className="border-b border-ink-100 bg-ink-50 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">
              {params.q
                ? `« ${params.q} »`
                : params.city
                  ? params.city
                  : params.cuisine
                    ? params.cuisine
                    : 'Restaurants'}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {data?.meta.total ?? '…'} résultat{(data?.meta.total ?? 0) > 1 ? 's' : ''}
              {isFetching && !isLoading && ' · mise à jour'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="lg:hidden">
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMapOpen((v) => !v)}
              className="lg:hidden"
            >
              {mapOpen ? 'Liste' : 'Carte'}
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-4 max-w-[1600px] space-y-3">
          <SearchChips
            params={params}
            onChange={setDraft}
            onApply={apply}
            onLocate={locateMe}
          />
          <button
            type="button"
            className="hidden text-sm font-medium text-brand-700 lg:inline"
            onClick={() => setMoreOpen((v) => !v)}
          >
            {moreOpen ? 'Moins de filtres' : 'Plus de filtres'}
          </button>
          {moreOpen && (
            <div className="hidden lg:block">
              <SearchFilters
                params={draft}
                onChange={setDraft}
                onSearch={() => apply(draft)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[minmax(0,1fr)_42%]">
        <div className={cn('px-4 py-5 sm:px-6', mapOpen && 'pb-56 lg:pb-5')}>
          {isLoading ? (
            <RestaurantGridSkeleton />
          ) : restaurants.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
              <p className="text-2xl font-bold text-ink-900">Aucune table ici</p>
              <p className="mt-2 text-sm text-ink-500">
                Élargissez la ville, retirez un filtre, ou cherchez près de vous.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {restaurants.map((r, i) => (
                <SearchResultCard
                  key={r.id}
                  index={i}
                  restaurant={r}
                  selected={selected?.id === r.id}
                  isAuth={isAuth}
                  onSelect={() => onSelectFromList(r)}
                  onToggleFavorite={(id, isFav) =>
                    toggleFavorite.mutate({ restaurantId: id, isFavorite: isFav })
                  }
                  favoriteLoading={toggleFavorite.isPending}
                />
              ))}
            </div>
          )}
        </div>

        <aside
          className={cn(
            'lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:p-4',
            mapOpen
              ? cn(
                  'sheet-up fixed inset-x-0 bottom-0 z-40 block rounded-t-3xl border-t border-ink-100 bg-ink-50 p-3 lg:static lg:rounded-none lg:border-0',
                  mapTall ? 'h-[70vh]' : 'h-[42vh]',
                )
              : 'hidden lg:block',
          )}
        >
          {mapOpen && (
            <div className="mb-2 flex items-center justify-between lg:hidden">
              <p className="text-sm font-semibold text-ink-800">Carte</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-ink-600"
                  aria-label={mapTall ? 'Réduire la carte' : 'Agrandir la carte'}
                  onClick={() => setMapTall((v) => !v)}
                >
                  <ChevronUp className={cn('h-5 w-5 transition-transform', mapTall && 'rotate-180')} />
                </button>
                <button type="button" className="rounded-lg p-1.5 text-ink-600" aria-label="Fermer la carte" onClick={() => setMapOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          {mapNode}
        </aside>
      </div>

      {filtersOpen && (
        <div className="overlay-fade fixed inset-0 z-[60] bg-ink-900/50 p-4 lg:hidden" role="dialog" aria-label="Filtres">
          <div className="sheet-right ml-auto flex h-full max-w-md flex-col rounded-2xl bg-ink-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Filtres</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SearchFilters
              params={draft}
              onChange={setDraft}
              onSearch={() => {
                apply(draft);
                setFiltersOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({
  restaurant,
  selected,
  isAuth,
  onSelect,
  onToggleFavorite,
  favoriteLoading,
  index,
}: {
  restaurant: Restaurant;
  selected: boolean;
  isAuth: boolean;
  onSelect: () => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  favoriteLoading: boolean;
  index: number;
}) {
  const { data: isFavorite } = useIsFavorite(restaurant.id, isAuth);

  return (
    <div onMouseEnter={onSelect} onFocus={onSelect}>
      <RestaurantCard
        restaurant={restaurant}
        selected={selected}
        index={index}
        isFavorite={isFavorite}
        onToggleFavorite={isAuth ? () => onToggleFavorite(restaurant.id, !!isFavorite) : undefined}
        favoriteLoading={favoriteLoading}
      />
    </div>
  );
}
