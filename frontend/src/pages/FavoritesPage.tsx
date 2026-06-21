import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { RestaurantGridSkeleton } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';

/** Page des favoris — liste des restaurants sauvegardés par l'utilisateur. */
export default function FavoritesPage() {
  const { data: favorites, isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  if (isLoading) return <RestaurantGridSkeleton />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <Heart className="h-7 w-7 text-brand-600 fill-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Mes favoris</h1>
          <p className="text-sm text-ink-500">
            {favorites?.length ?? 0} restaurant{(favorites?.length ?? 0) > 1 ? 's' : ''} sauvegardé{(favorites?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {!favorites?.length ? (
        <div className="mt-12 rounded-2xl bg-white p-12 text-center shadow-card">
          <Heart className="mx-auto h-12 w-12 text-ink-200" />
          <p className="mt-4 text-ink-500">Vous n'avez pas encore de favoris.</p>
          <Link to="/search" className="mt-6 inline-block">
            <Button>Explorer les restaurants</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <RestaurantCard
              key={fav.id}
              restaurant={fav.restaurant}
              isFavorite
              onToggleFavorite={() =>
                toggleFavorite.mutate({
                  restaurantId: fav.restaurantId,
                  isFavorite: true,
                })
              }
              favoriteLoading={toggleFavorite.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
