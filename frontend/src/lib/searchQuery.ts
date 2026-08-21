import type { SearchParams } from '../types';

/** Construit la query string de `/search` à partir des filtres actifs. */
export function searchParamsToQuery(params: SearchParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set('q', params.q.trim());
  if (params.city) sp.set('city', params.city);
  if (params.cuisine) sp.set('cuisine', params.cuisine);
  if (params.priceRange) sp.set('priceRange', String(params.priceRange));
  if (params.minRating) sp.set('minRating', String(params.minRating));
  if (params.lat != null) sp.set('lat', String(params.lat));
  if (params.lng != null) sp.set('lng', String(params.lng));
  if (params.sortBy && params.sortBy !== 'rating') sp.set('sortBy', params.sortBy);
  if (params.openNow) sp.set('openNow', '1');
  return sp;
}

/** Lit les filtres depuis l’URL de la page recherche. */
export function queryToSearchParams(urlParams: URLSearchParams): SearchParams {
  const lat = urlParams.get('lat');
  const lng = urlParams.get('lng');
  const price = urlParams.get('priceRange');
  const minRating = urlParams.get('minRating');
  const sortBy = urlParams.get('sortBy');
  const near = lat != null && lng != null;
  return {
    q: urlParams.get('q')?.trim() || undefined,
    city: urlParams.get('city') || undefined,
    cuisine: urlParams.get('cuisine') || undefined,
    priceRange: price ? Number(price) : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
    radius: near ? 5000 : undefined,
    sortBy:
      sortBy === 'name' || sortBy === 'distance' || sortBy === 'rating' || sortBy === 'createdAt'
        ? sortBy
        : near
          ? 'distance'
          : 'rating',
    order: 'desc',
    limit: 24,
    openNow: urlParams.get('openNow') === '1' || urlParams.get('openNow') === 'true',
  };
}
