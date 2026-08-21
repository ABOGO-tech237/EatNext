/** Types trop génériques pour servir de filtre diner. */
const GENERIC_CUISINE = /^(restauration|livraison|autre|restaurant)$/i;

export function isUsefulCuisine(name: string): boolean {
  return name.trim().length > 0 && !GENERIC_CUISINE.test(name.trim());
}

/** Villes mises en avant à l’accueil. */
export const HOME_CITY_NAMES = ['Douala', 'Yaoundé'] as const;
export const HOME_CITY_LIMIT = 2;
export const HOME_CUISINE_LIMIT = 3;

type NamedCount = { name: string; count: number };

function byCountDesc(a: NamedCount, b: NamedCount) {
  return b.count - a.count;
}

/** 2 villes : Douala et Yaoundé si elles existent, sinon les plus peuplées. */
export function pickHomeCities<T extends NamedCount>(cities: T[], limit = HOME_CITY_LIMIT): T[] {
  const preferred = HOME_CITY_NAMES.map((n) =>
    cities.find((c) => c.name.toLowerCase() === n.toLowerCase()),
  ).filter((c): c is T => Boolean(c));
  const rest = cities.filter((c) => !preferred.includes(c)).sort(byCountDesc);
  return [...preferred, ...rest].slice(0, limit);
}

/** 3 types de cuisine utiles, les plus fréquents. */
export function pickHomeCuisines<T extends NamedCount>(cuisines: T[], limit = HOME_CUISINE_LIMIT): T[] {
  return [...cuisines].filter((c) => isUsefulCuisine(c.name)).sort(byCountDesc).slice(0, limit);
}
