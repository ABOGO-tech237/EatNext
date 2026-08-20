import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RestaurantCard } from '../restaurant/RestaurantCard';
import { FadeIn } from '../ui/FadeIn';
import { Button } from '../ui/Button';
import { useRestaurantSearch, useSearchFilters } from '../../hooks/useRestaurants';
import type { SearchParams } from '../../types';

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

function Rail({ title, href, params }: { title: string; href: string; params: SearchParams }) {
  const navigate = useNavigate();
  const { data, isLoading } = useRestaurantSearch(params);
  const items = data?.items ?? [];

  if (!isLoading && items.length === 0) return null;

  return (
    <FadeIn inView className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate(href)}>
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
  );
}

/**
 * Collections — une rail par ville réellement présente en base.
 */
export function HomeRails() {
  const { data } = useSearchFilters();
  const rails = useMemo(() => {
    const cities = (data?.cities ?? []).slice(0, 4);
    return cities.map((c) => ({
      title: `Mieux notés à ${c.name}`,
      href: `/search?city=${encodeURIComponent(c.name)}`,
      params: { city: c.name, limit: 8, sortBy: 'rating' as const, order: 'desc' as const },
    }));
  }, [data?.cities]);

  if (rails.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl space-y-10 px-4 pb-4 sm:px-6">
      {rails.map((rail) => (
        <Rail key={rail.title} {...rail} />
      ))}
    </section>
  );
}
