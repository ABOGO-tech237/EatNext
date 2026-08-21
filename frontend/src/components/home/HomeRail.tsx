import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
 * Carrousel horizontal dans le shell accueil — large, pas collé aux bords.
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
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!isLoading && restaurants.length === 0 && !emptyLabel) {
    return null;
  }

  const scrollBy = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <section className="py-10">
      <div className="home-shell flex items-end justify-between">
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        <div className="flex items-center gap-2">
          {restaurants.length > 0 && (
            <div className="hidden gap-1 sm:flex">
              <button
                type="button"
                aria-label="Faire défiler vers la gauche"
                onClick={() => scrollBy(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Faire défiler vers la droite"
                onClick={() => scrollBy(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <Link to={href} className="text-sm font-medium text-brand-700 hover:underline">
            Voir tout
          </Link>
        </div>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <div className="home-shell">
            <RestaurantRailSkeleton />
          </div>
        ) : restaurants.length === 0 ? (
          emptyLabel ? (
            <p className="home-shell text-sm text-ink-500">{emptyLabel}</p>
          ) : null
        ) : (
          <div ref={scrollerRef} className="home-shell snap-rail flex gap-4 overflow-x-auto pb-2">
            {restaurants.map((restaurant, i) => (
              <div key={restaurant.id} className="w-[min(72vw,20.5rem)] shrink-0">
                <RestaurantCard
                  restaurant={restaurant}
                  variant="rail"
                  index={i}
                  hideClosedBadge
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
