import { useNavigate } from 'react-router-dom';
import { RestaurantCard } from '../restaurant/RestaurantCard';
import { FadeIn } from '../ui/FadeIn';
import { Button } from '../ui/Button';
import { useRestaurantSearch } from '../../hooks/useRestaurants';
import type { SearchParams } from '../../types';

const RAILS: { title: string; href: string; params: SearchParams }[] = [
  {
    title: 'Mieux notés à Yaoundé',
    href: '/search?city=Yaoundé',
    params: { city: 'Yaoundé', limit: 8, sortBy: 'rating', order: 'desc' },
  },
  {
    title: 'Mieux notés à Douala',
    href: '/search?city=Douala',
    params: { city: 'Douala', limit: 8, sortBy: 'rating', order: 'desc' },
  },
  {
    title: 'Moins de 5 000 FCFA',
    href: '/search?priceRange=1',
    params: { priceRange: 1, limit: 8, sortBy: 'rating', order: 'desc' },
  },
];

function Rail({ title, href, params }: (typeof RAILS)[number]) {
  const navigate = useNavigate();
  const { data } = useRestaurantSearch(params);
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <FadeIn inView className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate(href)}>
          Voir tout →
        </Button>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {items.map((r, i) => (
          <div key={r.id} className="w-[16.5rem] shrink-0 snap-start sm:w-[18rem]">
            <RestaurantCard restaurant={r} compact index={i} />
          </div>
        ))}
      </div>
    </FadeIn>
  );
}

/**
 * Collections horizontales — même GET /restaurants, autre mise en page.
 */
export function HomeRails() {
  return (
    <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
      {RAILS.map((rail) => (
        <Rail key={rail.title} {...rail} />
      ))}
    </section>
  );
}
