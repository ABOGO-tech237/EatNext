import { useNavigate } from 'react-router-dom';
import { RestaurantCard } from '../restaurant/RestaurantCard';
import { Button } from '../ui/Button';
import { FadeIn } from '../ui/FadeIn';
import { RestaurantGridSkeleton } from '../ui/Spinner';
import { useRestaurantSearch } from '../../hooks/useRestaurants';
import type { Restaurant } from '../../types';

const FEATURED_PARAMS = { limit: 6, sortBy: 'rating' as const, order: 'desc' as const };

interface HomeFeaturedProps {
  onToggleFavorite?: (restaurant: Restaurant, isFavorite: boolean) => void;
  isFavorite?: (id: string) => boolean;
  favoriteLoading?: boolean;
}

/**
 * Mieux notés — 1 carte large + 5 compactes.
 */
export function HomeFeatured({ onToggleFavorite, isFavorite, favoriteLoading }: HomeFeaturedProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useRestaurantSearch(FEATURED_PARAMS);
  const items = data?.items ?? [];
  const [hero, ...rest] = items;

  const cardProps = (restaurant: Restaurant) => ({
    isFavorite: isFavorite?.(restaurant.id),
    onToggleFavorite: onToggleFavorite
      ? () => onToggleFavorite(restaurant, !!isFavorite?.(restaurant.id))
      : undefined,
    favoriteLoading,
  });

  return (
    <section className="home-shell pt-12 pb-16">
      <FadeIn inView className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-900">Les mieux notés</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
          Voir tout →
        </Button>
      </FadeIn>
      <div className="mt-6">
        {isLoading ? (
          <RestaurantGridSkeleton />
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-10 text-sm text-ink-500">
            Aucune table publiée pour l’instant.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {hero && (
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
                <RestaurantCard restaurant={hero} featured index={0} hideClosedBadge {...cardProps(hero)} />
              </div>
            )}
            {rest.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} compact index={i + 1} hideClosedBadge {...cardProps(r)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
