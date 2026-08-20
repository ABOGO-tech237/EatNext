import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Globe, Heart, MapPin, Navigation, Phone, Store, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useRestaurant,
  useRestaurantReviews,
  useRestaurantMenu,
  useCreateReview,
  useClaimRestaurant,
  useNearbyRestaurants,
} from '../hooks/useRestaurants';
import { useIsFavorite, useToggleFavorite } from '../hooks/useFavorites';
import { useIsAuthenticated, useAuthStore } from '../stores/authStore';
import { useAuthActions } from '../hooks/useAuth';
import { RestaurantMap } from '../components/restaurant/RestaurantMap';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { ReviewCard } from '../components/restaurant/ReviewCard';
import { SourceBadge } from '../components/restaurant/SourceBadge';
import { Rating, RatingInput } from '../components/ui/Rating';
import { PriceRange } from '../components/ui/PriceRange';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PhotoCover } from '../components/ui/PhotoCover';
import {
  cn,
  formatPrice,
  mapsDirectionsUrl,
  neighborhoodFromAddress,
  openingStatus,
} from '../lib/utils';
import { FadeIn } from '../components/ui/FadeIn';

/**
 * Fiche diner : mosaïque, ouvert, actions sticky, menu cartes, nearby.
 */
export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();
  const user = useAuthStore((s) => s.user);
  const { refreshRole } = useAuthActions();
  const { data: restaurant, isLoading, error } = useRestaurant(id);
  const { data: reviewsData, isLoading: reviewsLoading } = useRestaurantReviews(id);
  const { data: menu = [] } = useRestaurantMenu(id);
  const { data: isFavorite } = useIsFavorite(id ?? '', isAuth);
  const toggleFavorite = useToggleFavorite();
  const createReview = useCreateReview(id ?? '');
  const claim = useClaimRestaurant();
  const { data: nearby = [] } = useNearbyRestaurants(restaurant?.lat, restaurant?.lng, 4000, 4);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div>
        <div className="shimmer h-72 sm:h-96" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="shimmer h-8 w-1/2 rounded" />
          <div className="shimmer mt-4 h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-2xl font-bold text-ink-900">Restaurant introuvable.</p>
        <Link to="/search" className="mt-4 inline-block text-brand-600 hover:underline">
          Retour à la recherche
        </Link>
      </div>
    );
  }

  const photos = restaurant.photos.filter(Boolean);
  const canClaim = !restaurant.ownerId;
  const isMine = user && restaurant.ownerId === user.id;
  const hours = openingStatus(restaurant.openingHours);
  const neighborhood = neighborhoodFromAddress(restaurant.address);
  const nearbyOthers = nearby.filter((r) => r.id !== restaurant.id).slice(0, 3);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReview.mutateAsync({ rating, content: content || undefined });
      toast.success('Avis publié !');
      setContent('');
      setRating(5);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de publier l'avis.");
    }
  };

  const handleClaim = async () => {
    if (!isAuth) {
      navigate('/login', { state: { from: `/restaurants/${restaurant.id}` } });
      return;
    }
    try {
      await claim.mutateAsync(restaurant.id);
      await refreshRole();
      toast.success('Fiche officielle — à vous.');
      navigate(`/pro/restaurants/${restaurant.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Revendication impossible.');
    }
  };

  const mosaicMain = photos[0];
  const mosaicSide = photos.length > 1 ? photos.slice(1, 3) : [undefined, undefined];

  return (
    <div className="bg-ink-50 pb-24 lg:pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <Link
          to="/search"
          className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <div className="grid gap-2 overflow-hidden rounded-3xl sm:grid-cols-3 sm:grid-rows-2 sm:h-[22rem] lg:h-[28rem]">
          <button
            type="button"
            className="relative min-h-[14rem] overflow-hidden bg-ink-900 sm:col-span-2 sm:row-span-2 sm:min-h-0"
            onClick={() => mosaicMain && setLightbox(mosaicMain)}
          >
            <PhotoCover
              src={mosaicMain}
              alt={restaurant.name}
              seed={restaurant.id}
              cuisine={restaurant.cuisineType}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-left text-white sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {restaurant.ownerId && <SourceBadge restaurant={restaurant} />}
                <Badge variant="muted" className="capitalize normal-case tracking-normal">
                  {restaurant.cuisineType}
                </Badge>
                {hours && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      hours.open ? 'bg-emerald-500 text-white' : 'bg-ink-800 text-white',
                    )}
                  >
                    {hours.label}
                  </span>
                )}
              </div>
              <FadeIn>
                <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{restaurant.name}</h1>
              </FadeIn>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Rating
                  value={restaurant.avgRating}
                  count={restaurant.reviewCount}
                  className="[&_span]:text-white"
                />
                <PriceRange range={restaurant.priceRange} className="text-amber-300" />
              </div>
            </div>
          </button>
          {mosaicSide.map((src, i) => (
            <button
              key={src ?? `cover-${i}`}
              type="button"
              className="relative hidden overflow-hidden bg-ink-800 sm:block"
              onClick={() => src && setLightbox(src)}
            >
              <PhotoCover src={src} alt="" seed={`${restaurant.id}-${i}`} cuisine={restaurant.cuisineType} />
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="overlay-fade fixed inset-0 z-[70] flex items-center justify-center bg-ink-900/80 p-4"
          role="dialog"
          aria-label="Photo"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-6 hidden flex-wrap gap-3 sm:flex">
          <a href={mapsDirectionsUrl(restaurant.lat, restaurant.lng)} target="_blank" rel="noreferrer">
            <Button>
              <Navigation className="h-4 w-4" />
              Itinéraire
            </Button>
          </a>
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`}>
              <Button variant="outline">
                <Phone className="h-4 w-4" />
                Appeler
              </Button>
            </a>
          )}
          {restaurant.website && (
            <a href={restaurant.website} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <Globe className="h-4 w-4" />
                Site
              </Button>
            </a>
          )}
          {isAuth && (
            <Button
              variant={isFavorite ? 'primary' : 'outline'}
              onClick={() =>
                toggleFavorite.mutate({ restaurantId: restaurant.id, isFavorite: !!isFavorite })
              }
              loading={toggleFavorite.isPending}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Favori' : 'Favori'}
            </Button>
          )}
          {isMine && (
            <Button variant="secondary" onClick={() => navigate(`/pro/restaurants/${restaurant.id}`)}>
              Gérer la fiche
            </Button>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-8">
            <section className="rounded-3xl bg-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">À propos</p>
              <p className="mt-3 leading-relaxed text-ink-600">
                {restaurant.description ?? 'Aucune description pour le moment.'}
              </p>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Carte</p>
              <h2 className="mt-1 text-2xl font-bold text-ink-900">Menu</h2>
              {menu.length === 0 ? (
                <p className="mt-4 text-sm text-ink-400">Le menu n'a pas encore été publié.</p>
              ) : (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {menu.map((item) => (
                    <li
                      key={`${item.name}-${item.price}`}
                      className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-ink-900">{item.name}</p>
                        <p className="shrink-0 font-semibold text-ink-900">{formatPrice(item.price)}</p>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-ink-500">{item.description}</p>
                      )}
                      {item.category && <p className="mt-2 text-xs text-ink-400">{item.category}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {nearbyOthers.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-ink-900">Dans le coin</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {nearbyOthers.map((r, i) => (
                    <RestaurantCard key={r.id} restaurant={r} compact index={i} />
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-3xl bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-ink-900">Avis ({restaurant.reviewCount})</h2>
              {isAuth && (
                <form onSubmit={handleSubmitReview} className="mt-4 rounded-2xl border border-ink-100 p-4">
                  <p className="mb-2 text-sm font-medium text-ink-700">Votre note</p>
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
                  <div className="shimmer h-24 rounded-2xl" />
                ) : reviewsData?.items.length === 0 ? (
                  <p className="text-sm text-ink-400">Aucun avis pour le moment.</p>
                ) : (
                  reviewsData?.items.map((review) => <ReviewCard key={review.id} review={review} />)
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Infos pratiques</p>
              <div className="flex items-start gap-3 text-sm text-ink-600">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <p>{restaurant.address}</p>
                  <p className="text-ink-400">
                    {neighborhood ? `${neighborhood} · ` : ''}
                    {restaurant.city}
                  </p>
                </div>
              </div>
              {restaurant.openingHours && (
                <div className="flex items-start gap-3 text-sm text-ink-600">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <div>
                    {hours && (
                      <p className={hours.open ? 'font-semibold text-emerald-700' : 'font-semibold text-ink-700'}>
                        {hours.label}
                      </p>
                    )}
                    <p>{restaurant.openingHours}</p>
                  </div>
                </div>
              )}
              {restaurant.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-5 w-5 text-brand-600" />
                  <a href={`tel:${restaurant.phone}`} className="text-ink-800 hover:underline">
                    {restaurant.phone}
                  </a>
                </div>
              )}
              {restaurant.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-5 w-5 text-brand-600" />
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-ink-800 hover:underline"
                  >
                    Site web
                  </a>
                </div>
              )}
              <PriceRange range={restaurant.priceRange} className="block text-sm" />
            </section>

            {canClaim && (
              <section className="rounded-2xl bg-brand-800 p-6 text-white">
                <Store className="h-5 w-5 text-mint-500" />
                <p className="mt-3 text-xl font-semibold">C'est votre établissement ?</p>
                <p className="mt-2 text-sm text-white/75">
                  Revendiquez cette fiche plutôt que d’en créer une autre.
                </p>
                <Button
                  className="mt-4 w-full bg-white text-brand-800 hover:bg-mint-500"
                  onClick={handleClaim}
                  loading={claim.isPending}
                >
                  Revendiquer cette fiche
                </Button>
              </section>
            )}

            <RestaurantMap
              restaurants={[restaurant]}
              center={[restaurant.lat, restaurant.lng]}
              zoom={15}
              height="240px"
            />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 px-4 py-3 backdrop-blur-md sm:hidden">
        <div className="flex gap-2">
          <a
            className="flex-1"
            href={mapsDirectionsUrl(restaurant.lat, restaurant.lng)}
            target="_blank"
            rel="noreferrer"
          >
            <Button className="w-full">
              <Navigation className="h-4 w-4" />
              Itinéraire
            </Button>
          </a>
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`}>
              <Button variant="outline">
                <Phone className="h-4 w-4" />
              </Button>
            </a>
          )}
          {isAuth && (
            <Button
              variant={isFavorite ? 'primary' : 'outline'}
              onClick={() =>
                toggleFavorite.mutate({ restaurantId: restaurant.id, isFavorite: !!isFavorite })
              }
              aria-label="Favori"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
