import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface CountUpProps {
  value: number | undefined;
  className?: string;
  /** Durée en ms. 400ms par défaut (plan). */
  duration?: number;
}

/**
 * Compte jusqu’à la valeur API. Instantané si prefers-reduced-motion.
 */
export function CountUp({ value, className, duration = 400 }: CountUpProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null) {
      setDisplay(0);
      return;
    }
    if (reduce) {
      setDisplay(value);
      return;
    }

    const from = 0;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce, duration]);

  if (value == null) {
    return <span className={className}>—</span>;
  }

  return <span className={className}>{display.toLocaleString('fr-FR')}</span>;
}
