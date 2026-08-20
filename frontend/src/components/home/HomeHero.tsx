import { useNavigate } from 'react-router-dom';
import { Search, Store } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';
import { DURATION, easeOut } from '../../lib/motion';
import { useIsAuthenticated } from '../../stores/authStore';
import { HERO_COVER } from '../../lib/covers';
import { HomeSearchBar } from './HomeSearchBar';
import { HomeStats } from './HomeStats';

/**
 * Hero court — intention d’abord (barre), puis deux CTA égaux.
 */
export function HomeHero() {
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();
  const reduce = useReducedMotion();

  const enter = (delay: number, y = 12) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.hero, delay, ease: easeOut },
        };

  return (
    <section className="relative min-h-[72vh] overflow-hidden bg-ink-900 text-white">
      <img
        src={HERO_COVER}
        alt=""
        className="hero-photo pointer-events-none absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900/40 via-brand-800/55 to-ink-900/80" />
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-orb absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white blur-3xl" />
        <div className="hero-orb absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white blur-3xl [animation-delay:1.4s]" />
      </div>

      <div className="relative mx-auto flex min-h-[72vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-20">
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-100"
          {...enter(0, 8)}
        >
          Yaoundé · Douala · Cameroun
        </motion.p>

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

        <motion.p
          className="mt-4 max-w-xl text-sm leading-relaxed text-brand-100 sm:text-base"
          {...enter(0.24, 10)}
        >
          Avis, cartes et prix en FCFA. Annuaire ouvert — sans paywall.
        </motion.p>

        <div className="mt-8 w-full max-w-3xl">
          <HomeSearchBar delay={0.32} />
        </div>

        <div className="mt-5 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
          <motion.div className="flex-1" {...enter(0.42)}>
            <Button
              size="lg"
              variant="secondary"
              className="w-full bg-white text-brand-700 hover:bg-brand-50"
              onClick={() => navigate('/search')}
            >
              <Search className="h-5 w-5" />
              Trouver une table
            </Button>
          </motion.div>
          <motion.div className="flex-1" {...enter(0.46)}>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white"
              onClick={() => navigate(isAuth ? '/pro/onboarding' : '/register?role=owner')}
            >
              <Store className="h-5 w-5" />
              Inscrire mon restaurant
            </Button>
          </motion.div>
        </div>

        <div className="mt-8">
          <HomeStats />
        </div>
      </div>
    </section>
  );
}
