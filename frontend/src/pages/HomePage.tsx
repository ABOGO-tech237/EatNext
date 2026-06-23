import { useNavigate } from 'react-router-dom';
import { Search, MapPin, UtensilsCrossed, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { Button } from '../components/ui/Button';
import { useRestaurantSearch, usePublicStats } from '../hooks/useRestaurants';
import { RestaurantGridSkeleton } from '../components/ui/Spinner';

const FEATURED_PARAMS = { limit: 6, sortBy: 'rating' as const, order: 'desc' as const };

/**
 * Page d'accueil — hero de recherche + catégories + restaurants populaires.
 * Première impression : chaleureuse, professionnelle, pas « template IA ».
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { data, isLoading } = useRestaurantSearch(FEATURED_PARAMS);
  const { data: stats } = usePublicStats();

  const heroStats = [
    { icon: UtensilsCrossed, label: 'Restaurants', value: stats ? String(stats.restaurants) : '—' },
    { icon: Star, label: 'Avis', value: stats ? String(stats.reviews) : '—' },
    { icon: MapPin, label: 'Villes', value: stats ? String(stats.cities) : '—' },
  ];

  const categories = [
    { label: 'Camerounaise', value: 'camerounaise', emoji: '🍲' },
    { label: 'Franco-africaine', value: 'franco-africaine', emoji: '🥘' },
    { label: 'Street food', value: 'nigériane', emoji: '🌶️' },
    { label: 'Terrasse', value: 'méditerranéenne', emoji: '☀️' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Trouvez votre prochaine table
            </h1>
            <p className="mt-4 text-lg text-brand-100 leading-relaxed">
              Explorez les restaurants de Yaoundé, Douala et au-delà. Avis vérifiés, cartes interactives, favoris personnalisés.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-brand-700 hover:bg-brand-50"
                onClick={() => navigate('/search')}
              >
                <Search className="h-5 w-5" />
                Commencer la recherche
              </Button>
            </div>
          </motion.div>

          <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg">
            {heroStats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <Icon className="mx-auto h-6 w-6 text-brand-200" />
                <p className="mt-1 text-2xl font-bold">{value}</p>
                <p className="text-sm text-brand-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories rapides */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-semibold text-ink-900">Parcourir par cuisine</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => navigate(`/search?cuisine=${cat.value}`)}
              className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition-all hover:border-brand-200 hover:shadow-card-hover text-left"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="font-medium text-ink-800 capitalize">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Restaurants populaires */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink-900">Les mieux notés</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
            Voir tout →
          </Button>
        </div>
        <div className="mt-6">
          {isLoading ? (
            <RestaurantGridSkeleton />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data?.items.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} compact />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
