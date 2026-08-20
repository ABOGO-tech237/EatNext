import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { DURATION, fadeIn, fadeUp, fadeUpTransition, viewportOnce } from '../../lib/motion';
import { cn } from '../../lib/utils';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  /** `up` = léger décalage vertical. `in` = opacity seule. */
  variant?: 'up' | 'in';
  /** Entrée au scroll, une seule fois. */
  inView?: boolean;
}

/**
 * Fade court sur un bloc (pas autour de <Outlet />, pas de layoutId).
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  duration = DURATION.enter,
  variant = 'up',
  inView = false,
}: FadeInProps) {
  const reduce = useReducedMotion();
  const presets = variant === 'in' ? fadeIn : fadeUp;

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={presets.initial}
      animate={inView ? undefined : presets.animate}
      whileInView={inView ? presets.animate : undefined}
      viewport={inView ? viewportOnce : undefined}
      transition={fadeUpTransition(delay, duration)}
    >
      {children}
    </motion.div>
  );
}
