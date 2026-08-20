/** Types trop génériques pour servir de filtre diner. */
const GENERIC_CUISINE = /^(restauration|livraison|autre|restaurant)$/i;

export function isUsefulCuisine(name: string): boolean {
  return name.trim().length > 0 && !GENERIC_CUISINE.test(name.trim());
}
