import { useEffect, useState } from 'react';
import { RestaurantCard } from '../restaurant/RestaurantCard';
import { RestaurantListSkeleton } from '../ui/Spinner';
import { useNearbyRestaurants, useRestaurantSearch } from '../../hooks/useRestaurants';
import { CAMEROON_CITIES } from '../../lib/utils';
import type { Restaurant } from '../../types';

interface HomeNearbyProps {
  onToggleFavorite?: (restaurant: Restaurant, isFavorite: boolean) => void;
  isFavorite?: (id: string) => boolean;
  favoriteLoading?: boolean;
}

/**
 * Liste verticale « Près de vous » — GPS réel, sinon Douala (libellé explicite).
 */
export function HomeNearby({ onToggleFavorite, isFavorite, favoriteLoading }: HomeNearbyProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<'pending' | 'ok' | 'fallback'>('pending');

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords({ lat: CAMEROON_CITIES[1].lat, lng: CAMEROON_CITIES[1].lng });
      setGeoState('fallback');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('ok');
      },
      () => {
        setCoords({ lat: CAMEROON_CITIES[1].lat, lng: CAMEROON_CITIES[1].lng });
        setGeoState('fallback');
      },
      { timeout: 8000, maximumAge: 120_000 },
    );
  }, []);

  const nearby = useNearbyRestaurants(coords?.lat, coords?.lng, 5000, 8);
  const fallback = useRestaurantSearch(
    { limit: 8, sortBy: 'rating', order: 'desc' },
    { enabled: geoState !== 'pending' && (nearby.data?.length ?? 0) === 0 && !nearby.isFetching },
  );

  const items = (nearby.data?.length ? nearby.data : fallback.data?.items) ?? [];
  const loading = geoState === 'pending' || nearby.isLoading;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 className="text-xl font-semibold text-ink-900">Près de vous</h2>
      {geoState === 'fallback' && (
        <p className="mt-1 text-sm text-ink-500">
          Position non disponible — liste autour de Douala (centre).
        </p>
      )}
      <div className="mt-4 space-y-4">
        {loading ? (
          <RestaurantListSkeleton />
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-8 text-sm text-ink-500">
            Aucun établissement à proximité pour l’instant.
          </p>
        ) : (
          items.map((restaurant, i) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              variant="list"
              index={i}
              isFavorite={isFavorite?.(restaurant.id)}
              onToggleFavorite={
                onToggleFavorite
                  ? () => onToggleFavorite(restaurant, !!isFavorite?.(restaurant.id))
                  : undefined
              }
              favoriteLoading={favoriteLoading}
            />
          ))
        )}
      </div>
    </section>
  );
}
