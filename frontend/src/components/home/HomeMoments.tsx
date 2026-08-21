import { useNavigate } from 'react-router-dom';
import { FadeIn } from '../ui/FadeIn';

const MOMENTS = [
  {
    q: 'terrasse',
    title: 'Terrasse',
    text: 'Tables dehors, lumière du soir.',
    src: '/covers/city-douala.png',
  },
  {
    q: 'grillades',
    title: 'Grillades',
    text: 'Braises, poisson et viande.',
    src: '/covers/cuisine-grillades.png',
  },
  {
    q: 'déjeuner d’affaires',
    title: 'Déjeuner d’affaires',
    text: 'Salles calmes, midi en ville.',
    src: '/covers/owner-salle.png',
  },
] as const;

/**
 * Intentions diner — 3 cartes max, pas un nouveau filtre.
 */
export function HomeMoments() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <FadeIn inView>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Moments</p>
        <h2 className="mt-2 text-xl font-semibold text-ink-900 sm:text-2xl">Pour ce soir</h2>
      </FadeIn>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {MOMENTS.map((moment, i) => (
          <FadeIn key={moment.q} inView delay={i * 0.06}>
            <button
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(moment.q)}`)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl text-left text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <img
                src={moment.src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
                decoding="async"
                aria-hidden
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-900/88 via-brand-900/45 to-brand-900/15" />
              <span className="absolute inset-x-0 bottom-0 p-4">
                <span className="block text-base font-semibold">{moment.title}</span>
                <span className="mt-0.5 block text-sm text-white/80">{moment.text}</span>
              </span>
            </button>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
