import { useNavigate } from 'react-router-dom';
import { RestaurantCard } from '../restaurant/RestaurantCard';
import { FadeIn } from '../ui/FadeIn';
import { Button } from '../ui/Button';
import { useRestaurantSearch } from '../../hooks/useRestaurants';

function RailSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-[16.5rem] shrink-0 overflow-hidden rounded-2xl bg-white shadow-card sm:w-[18rem]">
          <div className="shimmer aspect-[4/3]" />
          <div className="space-y-3 p-4">
            <div className="shimmer h-5 w-3/4 rounded" />
            <div className="shimmer h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Une seule collection — les villes sont déjà des tuiles au-dessus.
 */
export function HomeRails() {
  const navigate = useNavigate();
  const { data, isLoading } = useRestaurantSearch({
    limit: 8,
    sortBy: 'rating',
    order: 'desc',
  });
  const items = data?.items ?? [];

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
      <FadeIn inView className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink-900">Mieux notés</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
            Voir tout
          </Button>
        </div>
        {isLoading ? (
          <RailSkeleton />
        ) : (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {items.map((r, i) => (
              <div key={r.id} className="w-[16.5rem] shrink-0 snap-start sm:w-[18rem]">
                <RestaurantCard restaurant={r} compact index={i} />
              </div>
            ))}
          </div>
        )}
      </FadeIn>
    </section>
  );
}
