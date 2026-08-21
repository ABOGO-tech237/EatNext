import { useEffect, useState } from 'react';
import { RestaurantCard } from '../restaurant/RestaurantCard';
import { RestaurantListSkeleton } from '../ui/Spinner';
import { useNearbyRestaurants, useRestaurantSearch } from '../../hooks/useRestaurants';
import { CAMEROON_CITIES } from '../../lib/utils';
import type { Restaurant } from '../../types';

const DOUALA = CAMEROON_CITIES.find((c) => c.name === 'Douala') ?? CAMEROON_CITIES[1];

interface HomeNearbyProps {
  onToggleFavorite?: (restaurant: Restaurant, isFavorite: boolean) => void;
  isFavorite?: (id: string) => boolean;
  favoriteLoading?: boolean;
}

/**
 * Liste « près de vous » : GPS si dispo, sinon Douala sans message d’échec.
 */
export function HomeNearby({ onToggleFavorite, isFavorite, favoriteLoading }: HomeNearbyProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<'pending' | 'ok' | 'fallback'>('pending');

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords({ lat: DOUALA.lat, lng: DOUALA.lng });
      setGeoState('fallback');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('ok');
      },
      () => {
        setCoords({ lat: DOUALA.lat, lng: DOUALA.lng });
        setGeoState('fallback');
      },
      { timeout: 8000, maximumAge: 120_000 },
    );
  }, []);

  const nearby = useNearbyRestaurants(coords?.lat, coords?.lng, 5000, 6);
  const fallback = useRestaurantSearch(
    { city: DOUALA.name, limit: 6, sortBy: 'rating', order: 'desc' },
    { enabled: geoState === 'fallback' },
  );

  const items = geoState === 'ok' ? (nearby.data ?? []) : (fallback.data?.items ?? nearby.data ?? []);
  const loading = geoState === 'pending' || (geoState === 'ok' ? nearby.isLoading : fallback.isLoading);

  if (!loading && items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 className="text-xl font-semibold text-ink-900">
        {geoState === 'ok' ? 'Près de vous' : `Tables à ${DOUALA.name}`}
      </h2>
      <div className="mt-4 space-y-4">
        {loading ? (
          <RestaurantListSkeleton />
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
