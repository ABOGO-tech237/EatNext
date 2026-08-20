import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FadeIn } from '../ui/FadeIn';
import { PhotoCover } from '../ui/PhotoCover';
import { useRestaurantSearch, useSearchFilters } from '../../hooks/useRestaurants';

/**
 * Tuiles ville — plus utiles que les catégories Ayilaa génériques.
 */
export function HomeCuisines() {
  const navigate = useNavigate();
  const { data: filters } = useSearchFilters();
  const { data } = useRestaurantSearch({ limit: 24, sortBy: 'rating', order: 'desc' });
  const cities = filters?.cities ?? [];

  const coverByCity = useMemo(() => {
    const map = new Map<string, { src?: string; seed: string; cuisine?: string }>();
    for (const r of data?.items ?? []) {
      if (!map.has(r.city)) {
        map.set(r.city, { src: r.photos[0], seed: r.id, cuisine: r.cuisineType });
      }
    }
    return map;
  }, [data?.items]);

  if (cities.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <FadeIn inView>
        <h2 className="text-xl font-semibold text-ink-900">Parcourir par ville</h2>
      </FadeIn>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cities.map((city, i) => {
          const cover = coverByCity.get(city.name);
          return (
            <FadeIn key={city.name} inView delay={Math.min(i, 5) * 0.04}>
              <button
                type="button"
                onClick={() => navigate(`/search?city=${encodeURIComponent(city.name)}`)}
                className="group overflow-hidden rounded-2xl border border-ink-100 bg-white text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
                    <PhotoCover
                      src={cover?.src}
                      alt={city.name}
                      seed={cover?.seed ?? city.name}
                      cuisine={cover?.cuisine}
                    />
                  </div>
                </div>
                <span className="block px-3 py-2.5 text-sm font-medium text-ink-800">
                  {city.name}
                  <span className="ml-1 text-ink-400">· {city.count}</span>
                </span>
              </button>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
