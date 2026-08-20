import { motion, useReducedMotion } from 'framer-motion';
import { DURATION, easeOut } from '../../lib/motion';
import { HERO_COVER } from '../../lib/covers';
import { useSearchFilters } from '../../hooks/useRestaurants';
import { HomeSearchBar } from './HomeSearchBar';
import { HomeStats } from './HomeStats';

/**
 * Hero : une intention, une barre. Pas de CTA en double.
 */
export function HomeHero() {
  const reduce = useReducedMotion();
  const { data } = useSearchFilters();
  const cities = data?.cities.map((c) => c.name).slice(0, 4) ?? [];

  const enter = (delay: number, y = 12) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.hero, delay, ease: easeOut },
        };

  return (
    <section className="relative min-h-[62vh] overflow-hidden bg-ink-900 text-white">
      <img
        src={HERO_COVER}
        alt=""
        className="hero-photo pointer-events-none absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-900/45 via-brand-800/60 to-brand-900/85" />

      <div className="relative mx-auto flex min-h-[62vh] max-w-4xl flex-col items-center justify-center px-4 py-14 text-center sm:px-6 sm:py-16">
        {cities.length > 0 && (
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-500"
            {...enter(0, 8)}
          >
            {cities.join(' · ')}
          </motion.p>
        )}

        <h1 className="mt-3 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
          <motion.span className="block" {...enter(0.08)}>
            Trouvez votre
          </motion.span>
          <motion.span className="mt-1 block" {...enter(0.16)}>
            prochaine{' '}
            <span className="relative inline-block">
              table
              <span className="hero-underline" aria-hidden />
            </span>
          </motion.span>
        </h1>

        <div className="mt-8 w-full max-w-3xl">
          <HomeSearchBar delay={0.28} />
        </div>

        <div className="mt-8">
          <HomeStats />
        </div>
      </div>
    </section>
  );
}
