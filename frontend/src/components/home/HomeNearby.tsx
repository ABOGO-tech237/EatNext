import { HomeRail } from './HomeRail';
import { useNearbyRestaurants, useRestaurantSearch } from '../../hooks/useRestaurants';
import { CAMEROON_CITIES } from '../../lib/utils';
import { searchParamsToQuery } from '../../lib/searchQuery';
import type { Restaurant } from '../../types';
import { useEffect, useState } from 'react';

const DOUALA = CAMEROON_CITIES.find((c) => c.name === 'Douala') ?? CAMEROON_CITIES[1];

interface HomeNearbyProps {
  onToggleFavorite?: (restaurant: Restaurant, isFavorite: boolean) => void;
  isFavorite?: (id: string) => boolean;
  favoriteLoading?: boolean;
}

/**
 * Tables à Douala / près de vous — rail horizontal, largeur du shell accueil.
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

  const nearby = useNearbyRestaurants(coords?.lat, coords?.lng, 5000, 8);
  const fallback = useRestaurantSearch(
    { city: DOUALA.name, limit: 8, sortBy: 'rating', order: 'desc' },
    { enabled: geoState === 'fallback' },
  );

  const items = geoState === 'ok' ? (nearby.data ?? []) : (fallback.data?.items ?? nearby.data ?? []);
  const loading = geoState === 'pending' || (geoState === 'ok' ? nearby.isLoading : fallback.isLoading);

  return (
    <HomeRail
      title={geoState === 'ok' ? 'Près de vous' : `Tables à ${DOUALA.name}`}
      href={`/search?${searchParamsToQuery({ city: DOUALA.name })}`}
      restaurants={items}
      isLoading={loading}
      emptyLabel=""
      onToggleFavorite={onToggleFavorite}
      isFavorite={isFavorite}
      favoriteLoading={favoriteLoading}
    />
  );
}
