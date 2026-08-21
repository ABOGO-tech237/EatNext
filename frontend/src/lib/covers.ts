/** Visuels locaux — jamais de hotlink Unsplash. */

const SVG_COVERS: Record<string, string> = {
  camerounaise: '/covers/camerounaise.svg',
  'franco-africaine': '/covers/franco-africaine.svg',
  'ouest-africaine': '/covers/ouest-africaine.svg',
  méditerranéenne: '/covers/mediterraneenne.svg',
  mediterraneenne: '/covers/mediterraneenne.svg',
  nigériane: '/covers/nigeriane.svg',
  nigeriane: '/covers/nigeriane.svg',
  'fruits de mer': '/covers/fruits-de-mer.svg',
};

const PHOTO_COVERS: Record<string, string> = {
  camerounaise: '/covers/cuisine-camerounaise.png',
  camerounais: '/covers/cuisine-camerounaise.png',
  cameroonian: '/covers/cuisine-camerounaise.png',
  ndolé: '/covers/cuisine-camerounaise.png',
  ndole: '/covers/cuisine-camerounaise.png',
  grillades: '/covers/cuisine-grillades.png',
  grillade: '/covers/cuisine-grillades.png',
  grill: '/covers/cuisine-grillades.png',
  barbecue: '/covers/cuisine-grillades.png',
  'fruits de mer': '/covers/cuisine-fruits-de-mer.png',
  'fruit de mer': '/covers/cuisine-fruits-de-mer.png',
  seafood: '/covers/cuisine-fruits-de-mer.png',
  poisson: '/covers/cuisine-fruits-de-mer.png',
  'franco-africaine': '/covers/owner-salle.png',
  'ouest-africaine': '/covers/cuisine-grillades.png',
  nigériane: '/covers/cuisine-grillades.png',
  nigeriane: '/covers/cuisine-grillades.png',
  méditerranéenne: '/covers/city-yaounde.png',
  mediterraneenne: '/covers/city-yaounde.png',
};

export const DEFAULT_COVER = '/covers/default.svg';
export const HERO_COVER = '/covers/hero-restaurant.png';
export const OWNER_COVER = '/covers/owner-salle.png';

export const CITY_COVERS: Record<string, string> = {
  douala: '/covers/city-douala.png',
  yaoundé: '/covers/city-yaounde.png',
  yaounde: '/covers/city-yaounde.png',
};

function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Photo éditoriale de ville, sinon SVG par défaut. */
export function coverForCity(name?: string | null): string {
  if (!name) return DEFAULT_COVER;
  const raw = name.trim().toLowerCase();
  if (CITY_COVERS[raw]) return CITY_COVERS[raw];
  const key = fold(name);
  if (key.includes('douala')) return CITY_COVERS.douala;
  if (key.includes('yaound')) return CITY_COVERS.yaounde;
  return CITY_COVERS[key] ?? DEFAULT_COVER;
}

/**
 * Photo éditoriale si on en a une, sinon SVG cuisine, sinon défaut.
 * Les PNG gagnent toujours sur les SVG.
 */
export function coverForCuisine(cuisine?: string | null): string {
  if (!cuisine) return DEFAULT_COVER;
  const raw = cuisine.trim().toLowerCase();
  const key = fold(cuisine);

  if (PHOTO_COVERS[raw]) return PHOTO_COVERS[raw];
  if (PHOTO_COVERS[key]) return PHOTO_COVERS[key];

  if (/grill|bbq|barbecu/.test(key)) return PHOTO_COVERS.grillades;
  if (/fruit.?de.?mer|seafood|poisson|crevette|crustace/.test(key)) {
    return PHOTO_COVERS['fruits de mer'];
  }
  if (/cameroun|ndol|eru|achu|koki/.test(key)) return PHOTO_COVERS.camerounaise;

  return SVG_COVERS[raw] ?? SVG_COVERS[key] ?? DEFAULT_COVER;
}
