import { motion, useReducedMotion } from 'framer-motion';
import { DURATION, easeOut } from '../../lib/motion';
import { HERO_COVER } from '../../lib/covers';
import { pickHomeCities } from '../../lib/filters';
import { useSearchFilters } from '../../hooks/useRestaurants';
import { HomeSearchBar } from './HomeSearchBar';
import { HomeStats } from './HomeStats';

/**
 * Hero : une intention, une barre. Pas de CTA en double.
 */
export function HomeHero() {
  const reduce = useReducedMotion();
  const { data } = useSearchFilters();
  const cities = pickHomeCities(data?.cities ?? []).map((c) => c.name);

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
        fetchPriority="high"
        decoding="async"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-900/50 via-brand-900/62 to-brand-900/78" />

      <div className="relative mx-auto flex min-h-[62vh] max-w-4xl flex-col items-center justify-center px-4 py-14 text-center sm:px-6 sm:py-16">
        {cities.length > 0 && (
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-500"
            {...enter(0, 8)}
          >
            {cities.join(' · ')}
          </motion.p>
        )}

        <h1 className="mt-3 max-w-xl text-[2.5rem] font-bold leading-[1.1] tracking-tight drop-shadow-[0_2px_12px_rgba(5,36,22,0.55)] sm:text-5xl">
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
        <motion.p
          className="mt-4 max-w-md text-sm text-white/85 sm:text-base"
          {...enter(0.22, 8)}
        >
          Les tables de Douala et Yaoundé, prix en FCFA.
        </motion.p>

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
