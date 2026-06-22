import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import * as restaurantApi from '../lib/api/restaurants';
import { isPersistedInDb } from '../lib/utils';
import type { Restaurant } from '../types';

/**
 * Fiche POI OSM — synchronise en PostgreSQL via GET /restaurants/osm/:type/:id?sync=true
 * puis redirige vers la fiche EatNext (UUID) pour avis / favoris.
 */
export default function OsmRestaurantPage() {
  const navigate = useNavigate();
  const { osmType, osmId } = useParams<{ osmType: string; osmId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!osmType || !osmId) return;
    setLoading(true);
    setError(null);
    restaurantApi
      .syncOsmPlace(osmType, osmId)
      .then((r) => {
        setRestaurant(r);
        if (isPersistedInDb(r)) {
          toast.success('Restaurant enregistré en base');
          navigate(`/restaurants/${r.id}`, { replace: true });
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'POI introuvable'))
      .finally(() => setLoading(false));
  }, [osmType, osmId, navigate]);

  const handleSync = async () => {
    if (!osmType || !osmId) return;
    setSyncing(true);
    setError(null);
    try {
      const synced = await restaurantApi.syncOsmPlace(osmType, osmId);
      setRestaurant(synced);
      toast.success('Synchronisé en base PostgreSQL');
      if (isPersistedInDb(synced)) {
        navigate(`/restaurants/${synced.id}`, { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <Spinner />
        <p className="text-center text-sm text-ink-500 mt-4">
          Synchronisation OpenStreetMap → base de données…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link to="/search" className="text-sm text-brand-600 hover:underline">
        ← Retour recherche
      </Link>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {restaurant && (
        <article className="mt-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            OpenStreetMap
          </span>
          <h1 className="mt-2 text-2xl font-bold text-ink-900">{restaurant.name}</h1>
          <p className="mt-1 capitalize text-ink-600">{restaurant.cuisineType}</p>
          <p className="mt-2 text-sm text-ink-500">
            {restaurant.address}, {restaurant.city}
          </p>
          {restaurant.openingHours && (
            <p className="mt-2 text-sm text-ink-600">Horaires : {restaurant.openingHours}</p>
          )}
          {restaurant.phone && <p className="text-sm text-ink-600">Tél. {restaurant.phone}</p>}
          {restaurant.website && (
            <a
              href={restaurant.website}
              className="mt-1 block text-sm text-brand-600"
              target="_blank"
              rel="noreferrer"
            >
              {restaurant.website}
            </a>
          )}
          <p className="mt-4 text-xs text-ink-400">
            OSM {restaurant.osmType}/{restaurant.osmId}
          </p>
          <Button className="mt-4" onClick={handleSync} disabled={syncing}>
            {syncing ? 'Synchronisation…' : 'Enregistrer en base EatNext'}
          </Button>
        </article>
      )}
    </div>
  );
}
