import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as restaurantApi from '../lib/api/restaurants';
import type { Restaurant } from '../types';
import { Button } from '../components/ui/Button';
import { SourceBadge } from '../components/restaurant/SourceBadge';
import { useIsAuthenticated } from '../stores/authStore';
import { useClaimRestaurant } from '../hooks/useRestaurants';
import { useAuthActions } from '../hooks/useAuth';

/** Fiche OSM : sync persistée puis revendication possible. */
export default function OsmRestaurantPage() {
  const { osmType, osmId } = useParams<{ osmType: string; osmId: string }>();
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();
  const claim = useClaimRestaurant();
  const { refreshRole } = useAuthActions();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleClaim = async () => {
    if (!restaurant || restaurant.id.startsWith('osm-')) return;
    if (!isAuth) {
      navigate('/login', { state: { from: `/osm/${osmType}/${osmId}` } });
      return;
    }
    try {
      const claimed = await claim.mutateAsync(restaurant.id);
      await refreshRole();
      toast.success('Fiche OSM revendiquée.');
      navigate(`/pro/restaurants/${claimed.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Revendication impossible.');
    }
  };

  if (loading) {
    return <p className="p-8 text-ink-500">Chargement du lieu OpenStreetMap…</p>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link to="/search" className="text-sm text-brand-600">
        ← Retour recherche
      </Link>
      {error && <p className="mt-4 text-sm text-brand-600">{error}</p>}
      {restaurant && (
        <article className="mt-6 rounded-3xl bg-white p-6 shadow-card">
          <SourceBadge restaurant={restaurant} />
          <h1 className="mt-3 text-3xl font-bold text-ink-900">{restaurant.name}</h1>
          <p className="mt-1 capitalize text-ink-500">{restaurant.cuisineType}</p>
          <p className="mt-3 text-sm text-ink-500">
            {restaurant.address}, {restaurant.city}
          </p>
          {restaurant.openingHours && (
            <p className="mt-2 text-sm">Horaires : {restaurant.openingHours}</p>
          )}
          {restaurant.phone && <p className="text-sm">Tél. {restaurant.phone}</p>}
          {!restaurant.ownerId && !restaurant.id.startsWith('osm-') && (
            <Button className="mt-6 w-full" onClick={handleClaim} loading={claim.isPending}>
              C'est mon restaurant — revendiquer
            </Button>
          )}
        </article>
      )}
    </div>
  );
}
