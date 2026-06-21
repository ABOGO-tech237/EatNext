import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { Rating } from '../ui/Rating';
import { PriceRange } from '../ui/PriceRange';
import { cn, formatDistance } from '../../lib/utils';
import type { Restaurant } from '../../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  /** Affiche le bouton cœur si l'utilisateur est connecté. */
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  favoriteLoading?: boolean;
  compact?: boolean;
}

/**
 * Carte restaurant — composant central de la grille de recherche.
 * Design carte blanche avec ombre légère, photo en ratio 4:3, hover subtil.
 */
export function RestaurantCard({
  restaurant,
  isFavorite,
  onToggleFavorite,
  favoriteLoading,
  compact,
}: RestaurantCardProps) {
  const photo = restaurant.photos[0] ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
  const distance = formatDistance(restaurant.distance);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-card transition-shadow hover:shadow-card-hover"
    >
      <Link to={`/restaurants/${restaurant.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
          <img
            src={photo}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <Badge variant="brand" className="absolute left-3 top-3 capitalize">
            {restaurant.cuisineType}
          </Badge>
        </div>

        <div className={cn('p-4', compact && 'p-3')}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-ink-900 line-clamp-1 group-hover:text-brand-700 transition-colors">
              {restaurant.name}
            </h3>
            <PriceRange range={restaurant.priceRange} />
          </div>

          <div className="mt-2 flex items-center gap-1 text-sm text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {restaurant.city}
              {distance && <span className="text-ink-400"> · {distance}</span>}
            </span>
          </div>

          <div className="mt-2.5">
            <Rating value={restaurant.avgRating} count={restaurant.reviewCount} size="sm" />
          </div>

          {!compact && restaurant.description && (
            <p className="mt-2 text-sm text-ink-500 line-clamp-2">{restaurant.description}</p>
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
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full',
            'bg-white/90 backdrop-blur-sm shadow-sm transition-all',
            'hover:bg-white hover:scale-105',
            isFavorite ? 'text-brand-600' : 'text-ink-400 hover:text-brand-500',
          )}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
        </button>
      )}
    </motion.article>
  );
}
