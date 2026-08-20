/** Langage motion EatNext. Pas de layout, pas de layoutId, pas d’Outlet. */

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  micro: 0.18,
  enter: 0.32,
  hero: 0.48,
} as const;

/** Stagger 40ms, plafonné à 6 items (une grille de 24 ne cascade pas 1s). */
export const STAGGER = 0.04;
export const STAGGER_CAP = 6;

export function staggerDelay(index: number, base = 0): number {
  return base + Math.min(Math.max(index, 0), STAGGER_CAP - 1) * STAGGER;
}

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export const fadeUpSoft = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

/** Atterrissage de la barre de recherche home. */
export const searchLand = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

export function fadeUpTransition(delay = 0, duration: number = DURATION.enter) {
  return { duration, delay, ease: easeOut };
}

export const viewportOnce = { once: true, amount: 0.2 } as const;
