import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, List, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchFilters } from '../components/restaurant/SearchFilters';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { RestaurantMap } from '../components/restaurant/RestaurantMap';
import { Spinner, RestaurantGridSkeleton } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import {
  useRestaurantSearch,
  useNearbyRestaurants,
  useSyncOsmArea,
} from '../hooks/useRestaurants';
import { useToggleFavorite, useFavorites } from '../hooks/useFavorites';
import { useIsAuthenticated } from '../stores/authStore';
import type { SearchParams, Restaurant } from '../types';
import { cn } from '../lib/utils';

type ViewMode = 'list' | 'map' | 'split';

const NEARBY_RADIUS = 3000;

/**
 * Page recherche — filtres BDD + mode proximité OSM.
 * La base PostgreSQL est alimentée uniquement via l'API backend (POST /osm/sync).
 */
export default function SearchPage() {
  const [urlParams] = useSearchParams();
  const isAuth = useIsAuthenticated();
  const toggleFavorite = useToggleFavorite();
  const syncOsmArea = useSyncOsmArea();

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
  const [osmMode, setOsmMode] = useState(false);
  const [includeOsm, setIncludeOsm] = useState(true);

  useEffect(() => {
    setParams(initialParams);
    setActiveParams(initialParams);
  }, [initialParams]);

  const { data, isLoading, isFetching } = useRestaurantSearch(activeParams);
  const {
    data: nearbyList,
    isLoading: nearbyLoading,
    refetch: refetchNearby,
    isFetching: nearbyFetching,
  } = useNearbyRestaurants(mapCenter[0], mapCenter[1], NEARBY_RADIUS, includeOsm, osmMode);

  const searchRestaurants = data?.items ?? [];
  const restaurants = osmMode ? (nearbyList ?? []) : searchRestaurants;
  const loading = osmMode ? nearbyLoading : isLoading;
  const fetching = osmMode ? nearbyFetching : isFetching;

  const { data: favoritesList } = useFavorites(isAuth);
  const favoriteIds = useMemo(
    () => new Set(favoritesList?.map((f) => f.restaurantId)),
    [favoritesList],
  );

  const handleSearch = () => setActiveParams({ ...params });

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setOsmMode(true);
      },
      () => toast.error('Géolocalisation indisponible'),
    );
  };

  /** POST /restaurants/osm/sync — remplit PostgreSQL via l'API. */
  const handleSyncZone = async () => {
    try {
      const result = await syncOsmArea.mutateAsync({
        lat: mapCenter[0],
        lng: mapCenter[1],
        radius: NEARBY_RADIUS,
        limit: 50,
      });
      toast.success(`${result.synced} restaurant(s) synchronisé(s) en base`);
      if (osmMode) refetchNearby();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Échec de la synchronisation');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Rechercher un restaurant</h1>
        <p className="mt-1 text-sm text-ink-500">
          {osmMode
            ? `${restaurants.length} lieu(x) à proximité`
            : `${data?.meta.total ?? '…'} résultat${(data?.meta.total ?? 0) > 1 ? 's' : ''}`}
          {fetching && !loading && ' · mise à jour…'}
        </p>
      </div>

      {!osmMode && (
        <SearchFilters params={params} onChange={setParams} onSearch={handleSearch} />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
          <input
            type="checkbox"
            checked={osmMode}
            onChange={(e) => setOsmMode(e.target.checked)}
            className="rounded border-ink-300 text-brand-600"
          />
          Mode proximité (carte + OSM)
        </label>
        {osmMode && (
          <>
            <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOsm}
                onChange={(e) => setIncludeOsm(e.target.checked)}
                className="rounded border-ink-300 text-brand-600"
              />
              Inclure OpenStreetMap
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncZone}
              disabled={syncOsmArea.isPending}
            >
              <Download className="h-4 w-4 mr-1.5" />
              {syncOsmArea.isPending ? 'Sync…' : 'Synchroniser la zone'}
            </Button>
          </>
        )}
        <div className="flex-1" />
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

      {osmMode && (
        <p className="mt-2 text-xs text-ink-500">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-1" />
          OSM (non sync)
          <span className="inline-block w-2 h-2 rounded-full bg-green-700 ml-3 mr-1" />
          En base EatNext — sync via API
        </p>
      )}

      <div
        className={cn(
          'mt-4 gap-4',
          viewMode === 'split' ? 'lg:grid lg:grid-cols-2 lg:items-start' : 'block',
        )}
      >
        {(viewMode === 'list' || viewMode === 'split') && (
          <div>
            {loading ? (
              <RestaurantGridSkeleton />
            ) : restaurants.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-card">
                <p className="text-ink-500">
                  {osmMode
                    ? 'Aucun lieu dans cette zone. Essayez « Synchroniser la zone ».'
                    : 'Aucun restaurant ne correspond à vos critères.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {restaurants.map((r) => (
                  <SearchResultCard
                    key={r.id}
                    restaurant={r}
                    isAuth={isAuth}
                    isFavorite={favoriteIds.has(r.id)}
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
            {loading ? (
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

function SearchResultCard({
  restaurant,
  isAuth,
  isFavorite,
  onSelect,
  onToggleFavorite,
  favoriteLoading,
}: {
  restaurant: Restaurant;
  isAuth: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  favoriteLoading: boolean;
}) {
  return (
    <div onMouseEnter={onSelect} onFocus={onSelect}>
      <RestaurantCard
        restaurant={restaurant}
        isFavorite={isFavorite}
        onToggleFavorite={
          isAuth ? () => onToggleFavorite(restaurant.id, isFavorite) : undefined
        }
        favoriteLoading={favoriteLoading}
      />
    </div>
  );
}
