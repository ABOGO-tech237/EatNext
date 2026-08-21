import { useNavigate } from 'react-router-dom';
import { HomeCuisines } from '../components/home/HomeCuisines';
import { HomeFeatured } from '../components/home/HomeFeatured';
import { HomeHero } from '../components/home/HomeHero';
import { HomeMoments } from '../components/home/HomeMoments';
import { HomeNearby } from '../components/home/HomeNearby';
import { HomeOwnerCta } from '../components/home/HomeOwnerCta';
import { HomeRail } from '../components/home/HomeRail';
import { HomeSteps } from '../components/home/HomeSteps';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';
import { useRestaurantSearch } from '../hooks/useRestaurants';
import { searchParamsToQuery } from '../lib/searchQuery';
import { useIsAuthenticated } from '../stores/authStore';
import type { Restaurant } from '../types';

/**
 * Accueil EatNext : hero photo, 2 villes / 3 cuisines, mieux notés, moments,
 * puis rails de découverte — pas un clone DoorDash.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();
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
      <HomeHero />
      <HomeCuisines />
      <HomeFeatured {...favProps} />
      <HomeRail
        title="Nouveaux sur EatNext"
        href={`/search?${searchParamsToQuery({ sortBy: 'createdAt' })}`}
        restaurants={newest.data?.items ?? []}
        isLoading={newest.isLoading}
        emptyLabel=""
        {...favProps}
      />
      <HomeMoments />
      <HomeNearby {...favProps} />
      <HomeSteps />
      <HomeOwnerCta />
    </div>
  );
}
