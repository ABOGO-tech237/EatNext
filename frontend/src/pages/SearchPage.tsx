import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RestaurantMap } from '../components/restaurant/RestaurantMap';
import * as restaurantApi from '../lib/api/restaurants';
import type { Restaurant } from '../types';

/** Centre par défaut : Yaoundé (test Overpass). */
const DEFAULT_CENTER: [number, number] = [3.8667, 11.5167];

/**
 * Page recherche avec toggle « Inclure OpenStreetMap » et carte Leaflet.
 */
export default function SearchPage() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [includeOsm, setIncludeOsm] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await restaurantApi.getNearbyRestaurants(
        center[0],
        center[1],
        3000,
        40,
        includeOsm,
      );
      setRestaurants(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [center, includeOsm]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => undefined,
      { timeout: 8000 },
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="font-semibold text-lg text-gray-900">EatNext</Link>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={includeOsm}
            onChange={(e) => setIncludeOsm(e.target.checked)}
            className="rounded border-gray-300"
          />
          Inclure OpenStreetMap
        </label>
      </header>

      <div className="grid lg:grid-cols-2 gap-0 lg:gap-4 p-4 max-w-7xl mx-auto">
        <div className="h-[45vh] lg:h-[calc(100vh-5rem)] min-h-[280px]">
          <RestaurantMap
            restaurants={restaurants}
            center={center}
            selectedId={selected?.id}
            onSelect={setSelected}
            height="100%"
          />
        </div>

        <div className="mt-4 lg:mt-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Restaurants à proximité</h1>
            <button
              type="button"
              onClick={loadRestaurants}
              disabled={loading}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white disabled:opacity-50"
            >
              {loading ? '…' : 'Actualiser'}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <p className="text-xs text-gray-500">
            <span className="text-blue-600">●</span> OSM &nbsp;
            <span className="text-green-700">●</span> EatNext utilisateur
          </p>

          <ul className="flex-1 overflow-y-auto space-y-2 max-h-[50vh] lg:max-h-none">
            {restaurants.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selected?.id === r.id ? 'border-gray-900 bg-white shadow-sm' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{r.name}</span>
                    {r.distance != null && (
                      <span className="text-xs text-gray-400 shrink-0">{Math.round(r.distance)} m</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{r.cuisineType}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {r.source === 'OSM_SYNC' || r.id.startsWith('osm-') ? 'OpenStreetMap' : 'EatNext'}
                  </p>
                  {(r.source === 'OSM_SYNC' || r.id.startsWith('osm-')) && r.osmType && r.osmId && (
                    <Link
                      to={`/osm/${r.osmType}/${r.osmId}`}
                      className="text-xs text-blue-600 mt-2 inline-block"
                    >
                      Voir / synchroniser →
                    </Link>
                  )}
                </button>
              </li>
            ))}
            {!loading && restaurants.length === 0 && (
              <p className="text-sm text-gray-500">Aucun restaurant dans cette zone.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
