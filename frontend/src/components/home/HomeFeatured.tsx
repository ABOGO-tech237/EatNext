import { useNavigate } from 'react-router-dom';
import { RestaurantCard } from '../restaurant/RestaurantCard';
import { Button } from '../ui/Button';
import { FadeIn } from '../ui/FadeIn';
import { RestaurantGridSkeleton } from '../ui/Spinner';
import { useRestaurantSearch } from '../../hooks/useRestaurants';

const FEATURED_PARAMS = { limit: 6, sortBy: 'rating' as const, order: 'desc' as const };

/**
 * Mieux notés — 1 carte large + 5 compactes.
 */
export function HomeFeatured() {
  const navigate = useNavigate();
  const { data, isLoading } = useRestaurantSearch(FEATURED_PARAMS);
  const items = data?.items ?? [];
  const [hero, ...rest] = items;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <FadeIn inView className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-900">Les mieux notés</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
          Voir tout →
        </Button>
      </FadeIn>
      <div className="mt-6">
        {isLoading ? (
          <RestaurantGridSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hero && (
              <div className="sm:col-span-2 lg:col-span-3">
                <RestaurantCard restaurant={hero} featured index={0} />
              </div>
            )}
            {rest.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} compact index={i + 1} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
