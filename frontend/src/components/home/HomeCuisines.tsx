import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FadeIn } from '../ui/FadeIn';
import { PhotoCover } from '../ui/PhotoCover';
import { useRestaurantSearch, useSearchFilters } from '../../hooks/useRestaurants';
import { pickHomeCities, pickHomeCuisines } from '../../lib/filters';

/**
 * Accueil : 2 villes + 3 types de cuisine.
 */
export function HomeCuisines() {
  const navigate = useNavigate();
  const { data: filters } = useSearchFilters();
  const { data } = useRestaurantSearch({ limit: 24, sortBy: 'rating', order: 'desc' });
  const cities = pickHomeCities(filters?.cities ?? []);
  const cuisines = pickHomeCuisines(filters?.cuisines ?? []);

  const coverByCity = useMemo(() => {
    const map = new Map<string, { src?: string; seed: string; cuisine?: string }>();
    for (const r of data?.items ?? []) {
      if (!map.has(r.city)) {
        map.set(r.city, { src: r.photos[0], seed: r.id, cuisine: r.cuisineType });
      }
    }
    return map;
  }, [data?.items]);

  const coverByCuisine = useMemo(() => {
    const map = new Map<string, { src?: string; seed: string; cuisine?: string }>();
    for (const r of data?.items ?? []) {
      const key = r.cuisineType?.trim();
      if (key && !map.has(key)) {
        map.set(key, { src: r.photos[0], seed: r.id, cuisine: r.cuisineType });
      }
    }
    return map;
  }, [data?.items]);

  if (cities.length === 0 && cuisines.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6">
      {cities.length > 0 && (
        <div>
          <FadeIn inView>
            <h2 className="text-xl font-semibold text-ink-900">Parcourir par ville</h2>
          </FadeIn>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {cities.map((city, i) => {
              const cover = coverByCity.get(city.name);
              return (
                <FadeIn key={city.name} inView delay={i * 0.04}>
                  <button
                    type="button"
                    onClick={() => navigate(`/search?city=${encodeURIComponent(city.name)}`)}
                    className="group w-full overflow-hidden rounded-2xl border border-ink-100 bg-white text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
                  >
                    <div className="aspect-[16/9] overflow-hidden sm:aspect-[2/1]">
                      <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
                        <PhotoCover
                          src={cover?.src}
                          alt={city.name}
                          seed={cover?.seed ?? city.name}
                          cuisine={cover?.cuisine}
                        />
                      </div>
                    </div>
                    <span className="block px-4 py-3 text-sm font-medium text-ink-800">
                      {city.name}
                      <span className="ml-1 text-ink-400">· {city.count}</span>
                    </span>
                  </button>
                </FadeIn>
              );
            })}
          </div>
        </div>
      )}

      {cuisines.length > 0 && (
        <div>
          <FadeIn inView>
            <h2 className="text-xl font-semibold text-ink-900">Parcourir par cuisine</h2>
          </FadeIn>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {cuisines.map((cuisine, i) => {
              const cover = coverByCuisine.get(cuisine.name);
              return (
                <FadeIn key={cuisine.name} inView delay={i * 0.04}>
                  <button
                    type="button"
                    onClick={() => navigate(`/search?cuisine=${encodeURIComponent(cuisine.name)}`)}
                    className="group w-full overflow-hidden rounded-2xl border border-ink-100 bg-white text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
                  >
                    <div className="aspect-square overflow-hidden sm:aspect-[4/3]">
                      <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
                        <PhotoCover
                          src={cover?.src}
                          alt={cuisine.name}
                          seed={cover?.seed ?? cuisine.name}
                          cuisine={cuisine.name}
                        />
                      </div>
                    </div>
                    <span className="block px-3 py-2.5 text-sm font-medium capitalize text-ink-800">
                      {cuisine.name}
                      <span className="ml-1 text-ink-400">· {cuisine.count}</span>
                    </span>
                  </button>
                </FadeIn>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
