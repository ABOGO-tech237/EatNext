import { motion, useReducedMotion } from 'framer-motion';
import { CountUp } from '../ui/CountUp';
import { DURATION, easeOut, fadeIn } from '../../lib/motion';
import { useRestaurantStats } from '../../hooks/useRestaurants';

const ITEMS = [
  { label: 'restaurants', key: 'published' as const },
  { label: 'avis', key: 'reviews' as const },
  { label: 'villes', key: 'cities' as const },
];

/**
 * Preuve sociale — on cache les compteurs à zéro.
 */
export function HomeStats() {
  const { data: stats } = useRestaurantStats();
  const reduce = useReducedMotion();
  const visible = ITEMS.filter((item) => (stats?.[item.key] ?? 0) > 0);

  if (visible.length === 0) return null;

  return (
    <motion.p
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-brand-100"
      initial={reduce ? false : fadeIn.initial}
      animate={fadeIn.animate}
      transition={{ duration: DURATION.enter, delay: reduce ? 0 : 0.56, ease: easeOut }}
    >
      {visible.map(({ label, key }, i) => (
        <span key={label} className="inline-flex items-baseline gap-1">
          {i > 0 && <span className="mr-3 hidden text-white/30 sm:inline" aria-hidden>|</span>}
          <CountUp value={stats?.[key]} className="font-semibold tabular-nums text-white" />
          <span>{label}</span>
        </span>
      ))}
    </motion.p>
  );
}
