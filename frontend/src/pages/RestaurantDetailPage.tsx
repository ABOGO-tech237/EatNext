import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRestaurant, useRestaurantReviews, useCreateReview } from '../hooks/useRestaurants';
import { useIsFavorite, useToggleFavorite } from '../hooks/useFavorites';
import { useIsAuthenticated } from '../stores/authStore';
import { RestaurantMap } from '../components/restaurant/RestaurantMap';
import { ReviewCard } from '../components/restaurant/ReviewCard';
import { Rating, RatingInput } from '../components/ui/Rating';
import { PriceRange } from '../components/ui/PriceRange';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

/**
 * Fiche restaurant complète : galerie, infos, carte, avis et formulaire d'avis.
 */
export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isAuth = useIsAuthenticated();
  const { data: restaurant, isLoading, error } = useRestaurant(id);
  const { data: reviewsData, isLoading: reviewsLoading } = useRestaurantReviews(id);
  const { data: isFavorite } = useIsFavorite(id ?? '', isAuth);
  const toggleFavorite = useToggleFavorite();
  const createReview = useCreateReview(id ?? '');

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');

  if (isLoading) return <Spinner className="min-h-[60vh]" />;

  if (error || !restaurant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-ink-500">Restaurant introuvable.</p>
        <Link to="/search" className="mt-4 inline-block text-brand-600 hover:underline">
          Retour à la recherche
        </Link>
      </div>
    );
  }

  const photos = restaurant.photos.length > 0
    ? restaurant.photos
    : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'];

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReview.mutateAsync({ rating, content: content || undefined });
      toast.success('Avis publié !');
      setContent('');
      setRating(5);
    } catch {
      toast.error('Impossible de publier l\'avis.');
    }
  };

  return (
    <div className="pb-16">
      {/* Galerie hero */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-ink-200">
        <img
          src={photos[0]}
          alt={restaurant.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <Link
            to="/search"
            className="mb-4 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{restaurant.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Rating value={restaurant.avgRating} count={restaurant.reviewCount} className="[&_span]:text-white [&_svg]:drop-shadow" />
            <PriceRange range={restaurant.priceRange} className="text-white/90" />
            <Badge variant="brand" className="capitalize">{restaurant.cuisineType}</Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-6 flex flex-wrap gap-3">
          {isAuth && (
            <Button
              variant={isFavorite ? 'primary' : 'outline'}
              onClick={() =>
                toggleFavorite.mutate({ restaurantId: restaurant.id, isFavorite: !!isFavorite })
              }
              loading={toggleFavorite.isPending}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </Button>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="rounded-2xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-ink-900">À propos</h2>
              <p className="mt-3 text-ink-600 leading-relaxed">
                {restaurant.description ?? 'Aucune description disponible.'}
              </p>
            </section>

            {/* Avis */}
            <section className="rounded-2xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-ink-900">
                Avis ({restaurant.reviewCount})
              </h2>

              {isAuth && (
                <form onSubmit={handleSubmitReview} className="mt-4 rounded-xl border border-ink-100 p-4">
                  <p className="text-sm font-medium text-ink-700 mb-2">Votre note</p>
                  <RatingInput value={rating} onChange={setRating} />
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Partagez votre expérience…"
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <Button type="submit" className="mt-3" loading={createReview.isPending}>
                    Publier l'avis
                  </Button>
                </form>
              )}

              <div className="mt-6 space-y-3">
                {reviewsLoading ? (
                  <Spinner size="sm" />
                ) : reviewsData?.items.length === 0 ? (
                  <p className="text-sm text-ink-400">Aucun avis pour le moment.</p>
                ) : (
                  reviewsData?.items.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar infos + carte */}
          <div className="space-y-4">
            <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-ink-900">Informations</h2>
              <div className="flex items-start gap-3 text-sm text-ink-600">
                <MapPin className="h-5 w-5 shrink-0 text-brand-600 mt-0.5" />
                <div>
                  <p>{restaurant.address}</p>
                  <p className="text-ink-400">{restaurant.city}</p>
                </div>
              </div>
            </section>

            <RestaurantMap
              restaurants={[restaurant]}
              center={[restaurant.lat, restaurant.lng]}
              zoom={15}
              height="240px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
