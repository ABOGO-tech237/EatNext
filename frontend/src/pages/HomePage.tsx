import { useNavigate } from 'react-router-dom';
import { HomeDiscoverHeader } from '../components/home/HomeDiscoverHeader';
import { HomeQuickFilters } from '../components/home/HomeQuickFilters';
import { HomeRail } from '../components/home/HomeRail';
import { HomeNearby } from '../components/home/HomeNearby';
import { HomeOwnerCta } from '../components/home/HomeOwnerCta';
import { useRestaurantSearch } from '../hooks/useRestaurants';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';
import { useIsAuthenticated } from '../stores/authStore';
import { searchParamsToQuery } from '../lib/searchQuery';
import type { Restaurant } from '../types';

/**
 * Accueil découverte : header + filtres + rails + liste proximité.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();
  const recommended = useRestaurantSearch({ limit: 8, sortBy: 'rating', order: 'desc' });
  const newest = useRestaurantSearch({ limit: 8, sortBy: 'createdAt', order: 'desc' });
  const { data: favorites } = useFavorites(isAuth);
  const toggleFavorite = useToggleFavorite();
  const favIds = new Set((favorites ?? []).map((f) => f.restaurantId));

  const onToggle = (restaurant: Restaurant, isFavorite: boolean) => {
    if (!isAuth) {
      navigate('/login', { state: { from: '/' } });
      return;
    }
    toggleFavorite.mutate({ restaurantId: restaurant.id, isFavorite });
  };

  const favProps = isAuth
    ? {
        isFavorite: (id: string) => favIds.has(id),
        onToggleFavorite: onToggle,
        favoriteLoading: toggleFavorite.isPending,
      }
    : {};

  return (
    <div>
      <HomeDiscoverHeader />
      <HomeQuickFilters />
      <HomeRail
        title="Recommandé pour vous"
        href={`/search?${searchParamsToQuery({ sortBy: 'rating' })}`}
        restaurants={recommended.data?.items ?? []}
        isLoading={recommended.isLoading}
        emptyLabel="Aucun restaurant publié pour l’instant."
        {...favProps}
      />
      <HomeRail
        title="Nouveaux sur EatNext"
        href={`/search?${searchParamsToQuery({ sortBy: 'createdAt' })}`}
        restaurants={newest.data?.items ?? []}
        isLoading={newest.isLoading}
        emptyLabel="Pas encore de nouvelles fiches à afficher."
        {...favProps}
      />
      <HomeNearby {...favProps} />
      <HomeOwnerCta />
    </div>
  );
}
