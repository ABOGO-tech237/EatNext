import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, List } from 'lucide-react';
import { SearchFilters } from '../components/restaurant/SearchFilters';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { RestaurantMap } from '../components/restaurant/RestaurantMap';
import { Spinner, RestaurantGridSkeleton } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { useRestaurantSearch } from '../hooks/useRestaurants';
import { useIsFavorite, useToggleFavorite } from '../hooks/useFavorites';
import { useIsAuthenticated } from '../stores/authStore';
import type { SearchParams, Restaurant } from '../types';
import { cn } from '../lib/utils';

type ViewMode = 'list' | 'map' | 'split';

/**
 * Page de recherche — filtres + grille de résultats + carte Leaflet.
 * Vue split (desktop) ou bascule liste/carte (mobile).
 */
export default function SearchPage() {
  const [urlParams] = useSearchParams();
  const isAuth = useIsAuthenticated();
  const toggleFavorite = useToggleFavorite();

  const initialParams: SearchParams = useMemo(
    () => ({
      q: urlParams.get('q') ?? undefined,
      city: urlParams.get('city') ?? undefined,
      cuisine: urlParams.get('cuisine') ?? undefined,
      sortBy: 'rating',
      order: 'desc',
      limit: 20,
    }),
    [urlParams],
  );

  const [params, setParams] = useState<SearchParams>(initialParams);
  const [activeParams, setActiveParams] = useState<SearchParams>(initialParams);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.8667, 11.5167]);

  useEffect(() => {
    setParams(initialParams);
    setActiveParams(initialParams);
  }, [initialParams]);

  const { data, isLoading, isFetching } = useRestaurantSearch(activeParams);
  const restaurants = data?.items ?? [];

  const handleSearch = () => setActiveParams({ ...params });

  // Géolocalisation optionnelle pour centrer la carte
  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {},
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Rechercher un restaurant</h1>
        <p className="mt-1 text-sm text-ink-500">
          {data?.meta.total ?? '…'} résultat{(data?.meta.total ?? 0) > 1 ? 's' : ''}
          {isFetching && !isLoading && ' · mise à jour…'}
        </p>
      </div>

      <SearchFilters params={params} onChange={setParams} onSearch={handleSearch} />

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex rounded-xl border border-ink-200 bg-white p-1">
          {([
            { mode: 'list' as const, icon: List, label: 'Liste' },
            { mode: 'split' as const, icon: Map, label: 'Split' },
            { mode: 'map' as const, icon: Map, label: 'Carte' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                'hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === mode ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-50',
                mode === 'split' && 'hidden lg:flex',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={locateMe}>
          Ma position
        </Button>
      </div>

      <div
        className={cn(
          'mt-4 gap-4',
          viewMode === 'split' ? 'lg:grid lg:grid-cols-2 lg:items-start' : 'block',
        )}
      >
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className={cn(viewMode === 'list' ? 'block' : 'block')}>
            {isLoading ? (
              <RestaurantGridSkeleton />
            ) : restaurants.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-card">
                <p className="text-ink-500">Aucun restaurant ne correspond à vos critères.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {restaurants.map((r) => (
                  <SearchResultCard
                    key={r.id}
                    restaurant={r}
                    isAuth={isAuth}
                    onSelect={() => {
                      setSelected(r);
                      setMapCenter([r.lat, r.lng]);
                    }}
                    onToggleFavorite={(id, isFav) =>
                      toggleFavorite.mutate({ restaurantId: id, isFavorite: isFav })
                    }
                    favoriteLoading={toggleFavorite.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {(viewMode === 'map' || viewMode === 'split') && (
          <div
            className={cn(
              'sticky top-20',
              viewMode === 'map' ? 'h-[70vh]' : 'h-[500px] lg:h-[calc(100vh-12rem)]',
            )}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <RestaurantMap
                restaurants={restaurants}
                center={mapCenter}
                selectedId={selected?.id}
                onSelect={(r) => {
                  setSelected(r);
                  setMapCenter([r.lat, r.lng]);
                }}
                height="100%"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Sous-composant : carte avec état favori par restaurant. */
function SearchResultCard({
  restaurant,
  isAuth,
  onSelect,
  onToggleFavorite,
  favoriteLoading,
}: {
  restaurant: Restaurant;
  isAuth: boolean;
  onSelect: () => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  favoriteLoading: boolean;
}) {
  const { data: isFavorite } = useIsFavorite(restaurant.id, isAuth);

  return (
    <div onMouseEnter={onSelect} onFocus={onSelect}>
      <RestaurantCard
        restaurant={restaurant}
        isFavorite={isFavorite}
        onToggleFavorite={
          isAuth ? () => onToggleFavorite(restaurant.id, !!isFavorite) : undefined
        }
        favoriteLoading={favoriteLoading}
      />
    </div>
  );
}
