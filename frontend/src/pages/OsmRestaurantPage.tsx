import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as restaurantApi from '../lib/api/restaurants';
import type { Restaurant } from '../types';

/**
 * Page stub : affiche un POI OSM et permet la synchronisation en base au clic.
 */
export default function OsmRestaurantPage() {
  const { osmType, osmId } = useParams<{ osmType: string; osmId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!osmType || !osmId) return;
    setLoading(true);
    restaurantApi
      .syncOsmPlace(osmType, osmId)
      .then(setRestaurant)
      .catch((e) => setError(e instanceof Error ? e.message : 'POI introuvable'))
      .finally(() => setLoading(false));
  }, [osmType, osmId]);

  const handleSync = async () => {
    if (!osmType || !osmId) return;
    setSyncing(true);
    setError(null);
    try {
      const synced = await restaurantApi.syncOsmPlace(osmType, osmId);
      setRestaurant(synced);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-gray-600">Chargement du POI OpenStreetMap…</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-lg mx-auto">
      <Link to="/search" className="text-sm text-blue-600">← Retour recherche</Link>

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      {restaurant && (
        <article className="mt-6 bg-white rounded-2xl border p-6 shadow-sm">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            OpenStreetMap
          </span>
          <h1 className="text-2xl font-semibold mt-2">{restaurant.name}</h1>
          <p className="text-gray-600 capitalize mt-1">{restaurant.cuisineType}</p>
          <p className="text-sm text-gray-500 mt-2">{restaurant.address}, {restaurant.city}</p>
          {restaurant.openingHours && (
            <p className="text-sm mt-2">Horaires : {restaurant.openingHours}</p>
          )}
          {restaurant.phone && <p className="text-sm">Tél. {restaurant.phone}</p>}
          {restaurant.website && (
            <a href={restaurant.website} className="text-sm text-blue-600 block mt-1" target="_blank" rel="noreferrer">
              {restaurant.website}
            </a>
          )}
          <p className="text-xs text-gray-400 mt-4">
            OSM {restaurant.osmType}/{restaurant.osmId}
            {restaurant.id && !restaurant.id.startsWith('osm-') && (
              <> · ID EatNext <code>{restaurant.id}</code></>
            )}
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="mt-4 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
          >
            {syncing ? 'Synchronisation…' : 'Resynchroniser depuis OSM'}
          </button>
        </article>
      )}
    </div>
  );
}
