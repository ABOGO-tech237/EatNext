import { Link } from 'react-router-dom';
import { RestaurantCard } from '../restaurant/RestaurantCard';
import { RestaurantRailSkeleton } from '../ui/Spinner';
import type { Restaurant } from '../../types';

interface HomeRailProps {
  title: string;
  href?: string;
  restaurants: Restaurant[];
  isLoading?: boolean;
  emptyLabel?: string;
  onToggleFavorite?: (restaurant: Restaurant, isFavorite: boolean) => void;
  isFavorite?: (id: string) => boolean;
  favoriteLoading?: boolean;
}

/**
 * Carrousel horizontal snap. Si `emptyLabel` est vide, la section disparaît.
 */
export function HomeRail({
  title,
  href = '/search',
  restaurants,
  isLoading,
  emptyLabel,
  onToggleFavorite,
  isFavorite,
  favoriteLoading,
}: HomeRailProps) {
  if (!isLoading && restaurants.length === 0 && !emptyLabel) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="mx-auto flex max-w-7xl items-end justify-between px-4 sm:px-6">
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        <Link to={href} className="text-sm font-medium text-brand-700 hover:underline">
          Voir tout
        </Link>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <RestaurantRailSkeleton />
        ) : restaurants.length === 0 ? (
          emptyLabel ? (
            <p className="mx-auto max-w-7xl px-4 text-sm text-ink-500 sm:px-6">{emptyLabel}</p>
          ) : null
        ) : (
          <div className="snap-rail flex gap-4 overflow-x-auto px-4 pb-2 sm:px-6">
            {restaurants.map((restaurant, i) => (
              <div key={restaurant.id} className="w-[min(80vw,17.5rem)] shrink-0">
                <RestaurantCard
                  restaurant={restaurant}
                  variant="rail"
                  index={i}
                  isFavorite={isFavorite?.(restaurant.id)}
                  onToggleFavorite={
                    onToggleFavorite
                      ? () => onToggleFavorite(restaurant, !!isFavorite?.(restaurant.id))
                      : undefined
                  }
                  favoriteLoading={favoriteLoading}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
