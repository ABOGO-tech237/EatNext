/** Visuels locaux — jamais de hotlink Unsplash. */

const COVERS: Record<string, string> = {
  camerounaise: '/covers/camerounaise.svg',
  'franco-africaine': '/covers/franco-africaine.svg',
  'ouest-africaine': '/covers/ouest-africaine.svg',
  méditerranéenne: '/covers/mediterraneenne.svg',
  mediterraneenne: '/covers/mediterraneenne.svg',
  nigériane: '/covers/nigeriane.svg',
  nigeriane: '/covers/nigeriane.svg',
  'fruits de mer': '/covers/fruits-de-mer.svg',
};

export const DEFAULT_COVER = '/covers/default.svg';
export const HERO_COVER = '/covers/hero.svg';

export function coverForCuisine(cuisine?: string | null): string {
  if (!cuisine) return DEFAULT_COVER;
  return COVERS[cuisine.trim().toLowerCase()] ?? DEFAULT_COVER;
}
