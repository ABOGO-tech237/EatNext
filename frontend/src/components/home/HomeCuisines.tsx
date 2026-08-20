import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FadeIn } from '../ui/FadeIn';
import { PhotoCover } from '../ui/PhotoCover';
import { useRestaurantSearch, useSearchFilters } from '../../hooks/useRestaurants';

/**
 * Tuiles cuisine — types réellement présents en base.
 */
export function HomeCuisines() {
  const navigate = useNavigate();
  const { data: filters } = useSearchFilters();
  const { data } = useRestaurantSearch({ limit: 24, sortBy: 'rating', order: 'desc' });
  const cuisines = filters?.cuisines ?? [];

  const coverByCuisine = useMemo(() => {
    const map = new Map<string, { src?: string; seed: string }>();
    for (const r of data?.items ?? []) {
      const key = r.cuisineType;
      if (!map.has(key)) {
        map.set(key, { src: r.photos[0], seed: r.id });
      }
    }
    return map;
  }, [data?.items]);

  if (cuisines.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <FadeIn inView>
        <h2 className="text-xl font-semibold text-ink-900">Parcourir par cuisine</h2>
      </FadeIn>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cuisines.map((cat, i) => {
          const cover = coverByCuisine.get(cat.name);
          return (
            <FadeIn key={cat.name} inView delay={Math.min(i, 5) * 0.04}>
              <button
                type="button"
                onClick={() => navigate(`/search?cuisine=${encodeURIComponent(cat.name)}`)}
                className="group overflow-hidden rounded-2xl border border-ink-100 bg-white text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
                    <PhotoCover
                      src={cover?.src}
                      alt={cat.name}
                      seed={cover?.seed ?? cat.name}
                      cuisine={cat.name}
                    />
                  </div>
                </div>
                <span className="block px-3 py-2.5 text-sm font-medium capitalize text-ink-800">
                  {cat.name}
                </span>
              </button>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
