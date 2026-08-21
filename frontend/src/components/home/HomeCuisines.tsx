import { useNavigate } from 'react-router-dom';
import { FadeIn } from '../ui/FadeIn';
import { PhotoCover } from '../ui/PhotoCover';
import { useSearchFilters } from '../../hooks/useRestaurants';
import { coverForCity, coverForCuisine } from '../../lib/covers';
import { pickHomeCities, pickHomeCuisines } from '../../lib/filters';

const CITY_SUBTITLES: Record<string, string> = {
  douala: 'Akwa, Bonanjo, Deido',
  yaoundé: 'Bastos, Mvan, Nlongkak',
  yaounde: 'Bastos, Mvan, Nlongkak',
};

function citySubtitle(name: string): string | undefined {
  const key = name.trim().toLowerCase();
  if (CITY_SUBTITLES[key]) return CITY_SUBTITLES[key];
  const folded = key.normalize('NFD').replace(/\p{M}/gu, '');
  if (folded.includes('douala')) return CITY_SUBTITLES.douala;
  if (folded.includes('yaound')) return CITY_SUBTITLES.yaounde;
  return CITY_SUBTITLES[folded];
}

/**
 * Accueil : 2 villes + 3 types de cuisine.
 */
export function HomeCuisines() {
  const navigate = useNavigate();
  const { data: filters } = useSearchFilters();
  const cities = pickHomeCities(filters?.cities ?? []);
  const cuisines = pickHomeCuisines(filters?.cuisines ?? []);

  if (cities.length === 0 && cuisines.length === 0) return null;

  return (
    <section className="home-shell space-y-10 py-12">
      {cities.length > 0 && (
        <div>
          <FadeIn inView>
            <h2 className="text-xl font-semibold text-ink-900">Parcourir par ville</h2>
          </FadeIn>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {cities.map((city, i) => {
              const subtitle = citySubtitle(city.name);
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
                          src={coverForCity(city.name)}
                          alt={city.name}
                          seed={city.name}
                        />
                      </div>
                    </div>
                    <span className="block px-4 py-3">
                      <span className="block text-sm font-medium text-ink-800">
                        {city.name}
                        <span className="ml-1 text-ink-400">· {city.count}</span>
                      </span>
                      {subtitle && (
                        <span className="mt-0.5 block text-xs text-ink-400">{subtitle}</span>
                      )}
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
                          src={coverForCuisine(cuisine.name)}
                          alt={cuisine.name}
                          seed={cuisine.name}
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
