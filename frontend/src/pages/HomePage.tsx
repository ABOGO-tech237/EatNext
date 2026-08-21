import { useNavigate } from 'react-router-dom';
import { HomeCuisines } from '../components/home/HomeCuisines';
import { HomeFeatured } from '../components/home/HomeFeatured';
import { HomeHero } from '../components/home/HomeHero';
import { HomeMoments } from '../components/home/HomeMoments';
import { HomeNearby } from '../components/home/HomeNearby';
import { HomeOwnerCta } from '../components/home/HomeOwnerCta';
import { HomeSteps } from '../components/home/HomeSteps';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';
import { useIsAuthenticated } from '../stores/authStore';
import type { Restaurant } from '../types';

/**
 * Accueil EatNext : hero, villes / cuisines, mieux notés, tables horizontales.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();
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
      <HomeNearby {...favProps} />
      <HomeMoments />
      <HomeSteps />
      <HomeOwnerCta />
    </div>
  );
}
