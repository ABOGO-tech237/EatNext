import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';
import { DURATION, easeOut, searchLand } from '../../lib/motion';
import { useSearchFilters } from '../../hooks/useRestaurants';
import { pickHomeCities } from '../../lib/filters';
import { searchParamsToQuery } from '../../lib/searchQuery';

/**
 * Barre de recherche — 2 villes à l’accueil.
 */
export function HomeSearchBar({ delay = 0.32 }: { delay?: number }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { data } = useSearchFilters();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const cities = pickHomeCities(data?.cities ?? []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?${searchParamsToQuery({ q: q.trim() || undefined, city: city || undefined })}`);
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        navigate(
          `/search?${searchParamsToQuery({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            sortBy: 'distance',
          })}`,
        );
      },
      () => navigate('/search'),
    );
  };

  return (
    <motion.form
      onSubmit={handleSearch}
      className="grid w-full gap-3 rounded-2xl bg-white p-3 shadow-card sm:grid-cols-[1fr_10rem_auto_auto]"
      role="search"
      aria-label="Rechercher un restaurant"
      initial={reduce ? false : searchLand.initial}
      animate={searchLand.animate}
      transition={{ duration: DURATION.hero, delay: reduce ? 0 : delay, ease: easeOut }}
    >
      <label className="sr-only" htmlFor="home-q">
        Plat, restaurant, ambiance
      </label>
      <input
        id="home-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Restaurant, cuisine, quartier…"
        className="h-12 rounded-xl border-0 bg-transparent px-4 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0"
      />
      <select
        aria-label="Ville"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="h-12 rounded-xl border-0 bg-transparent px-3 text-sm text-ink-800 focus:outline-none"
      >
        <option value="">Toutes les villes</option>
        {cities.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <Button type="button" variant="ghost" className="h-12 text-ink-800" onClick={locateMe}>
        <MapPin className="h-4 w-4" />
        Près de moi
      </Button>
      <Button type="submit" className="h-12">
        Chercher
      </Button>
    </motion.form>
  );
}
