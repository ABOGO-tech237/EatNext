import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { Rating } from '../ui/Rating';
import { PriceRange } from '../ui/PriceRange';
import { PhotoCover } from '../ui/PhotoCover';
import { isUsefulCuisine } from '../../lib/filters';
import {
  cn,
  firstSentence,
  formatDistance,
  neighborhoodFromAddress,
} from '../../lib/utils';
import { DURATION, easeOut, fadeUp, staggerDelay } from '../../lib/motion';
import type { Restaurant } from '../../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  favoriteLoading?: boolean;
  compact?: boolean;
  selected?: boolean;
  featured?: boolean;
  /** Index de grille — stagger 40ms, cap 6. */
  index?: number;
}

function PhotoCarousel({
  photos,
  name,
  seed,
  cuisine,
}: {
  photos: string[];
  name: string;
  seed: string;
  cuisine?: string | null;
}) {
  const [i, setI] = useState(0);
  const total = photos.length;

  const go = (e: MouseEvent, next: number) => {
    e.preventDefault();
    e.stopPropagation();
    setI((next + total) % total);
  };

  return (
    <div className="relative h-full w-full">
      <PhotoCover src={photos[i]} alt={name} seed={seed} cuisine={cuisine} />
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={(e) => go(e, i - 1)}
            className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={(e) => go(e, i + 1)}
            className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1">
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  idx === i ? 'bg-white' : 'bg-white/50',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Carte restaurant — carrousel, quartier, extrait, hover CSS.
 */
export function RestaurantCard({
  restaurant,
  isFavorite,
  onToggleFavorite,
  favoriteLoading,
  compact,
  selected,
  featured,
  index = 0,
}: RestaurantCardProps) {
  const reduce = useReducedMotion();
  const photos = restaurant.photos.filter(Boolean);
  const distance = formatDistance(restaurant.distance);
  const neighborhood = neighborhoodFromAddress(restaurant.address);
  const excerpt = firstSentence(restaurant.description);
  const href =
    restaurant.id.startsWith('osm-') && restaurant.osmType && restaurant.osmId
      ? `/osm/${restaurant.osmType}/${restaurant.osmId}`
      : `/restaurants/${restaurant.id}`;

  return (
    <motion.article
      data-restaurant-id={restaurant.id}
      initial={reduce ? false : fadeUp.initial}
      animate={fadeUp.animate}
      transition={{ duration: DURATION.enter, delay: reduce ? 0 : staggerDelay(index), ease: easeOut }}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover',
        selected && 'ring-2 ring-brand-500',
        featured && 'sm:grid sm:grid-cols-[minmax(0,1.2fr)_1fr]',
      )}
    >
      <Link to={href} className="block">
        <div
          className={cn(
            'relative overflow-hidden bg-ink-800',
            featured ? 'aspect-[16/10] sm:aspect-auto sm:min-h-[16rem] sm:h-full' : 'aspect-[4/3]',
          )}
        >
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
            {photos.length > 1 ? (
              <PhotoCarousel
                photos={photos}
                name={restaurant.name}
                seed={restaurant.id}
                cuisine={restaurant.cuisineType}
              />
            ) : (
              <PhotoCover
                src={photos[0]}
                alt={restaurant.name}
                seed={restaurant.id}
                cuisine={restaurant.cuisineType}
              />
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {isUsefulCuisine(restaurant.cuisineType) && (
            <Badge variant="brand" className="absolute left-3 top-3 capitalize">
              {restaurant.cuisineType}
            </Badge>
          )}
        </div>

        <div className={cn('p-4', compact && 'p-3', featured && 'sm:flex sm:flex-col sm:justify-center sm:p-6')}>
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'font-semibold text-ink-900 line-clamp-1 group-hover:text-brand-700',
                featured && 'text-2xl',
              )}
            >
              {restaurant.name}
            </h3>
            <PriceRange range={restaurant.priceRange} />
          </div>

          <div className="mt-2 flex items-center gap-1 text-sm text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {neighborhood ? `${neighborhood} · ` : ''}
              {restaurant.city}
              {distance && <span className="text-ink-400"> · {distance}</span>}
            </span>
          </div>

          {restaurant.reviewCount > 0 && (
            <div className="mt-2.5">
              <Rating value={restaurant.avgRating} count={restaurant.reviewCount} size="sm" />
            </div>
          )}

          {!compact && excerpt && (
            <p className={cn('mt-2 text-sm text-ink-500', featured ? 'line-clamp-3' : 'line-clamp-2')}>
              {excerpt}
            </p>
          )}
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite();
          }}
          disabled={favoriteLoading}
          className={cn(
            'absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full',
            'bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-white',
            isFavorite ? 'text-brand-600' : 'text-ink-400 hover:text-brand-500',
          )}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            className={cn(
              'h-5 w-5 heart-pop',
              isFavorite && 'fill-current',
            )}
          />
        </button>
      )}
    </motion.article>
  );
}
