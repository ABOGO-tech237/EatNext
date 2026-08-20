import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, MapPinned, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SourceBadge } from '../../components/restaurant/SourceBadge';
import { useClaimRestaurant, useRestaurantSearch } from '../../hooks/useRestaurants';
import { useAuthActions } from '../../hooks/useAuth';
import type { Restaurant } from '../../types';
import { FadeIn } from '../../components/ui/FadeIn';

/**
 * Onboarding restaurateur — 3 choix : revendiquer / créer / plusieurs sites.
 */
export default function ProOnboardingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'claim'>('choose');
  const [q, setQ] = useState('');
  const [city, setCity] = useState('Yaoundé');
  const [activeQ, setActiveQ] = useState('');
  const claim = useClaimRestaurant();
  const { refreshRole } = useAuthActions();

  const { data, isFetching } = useRestaurantSearch({
    q: activeQ || undefined,
    city,
    limit: 12,
    sortBy: 'name',
  });

  const handleClaim = async (restaurant: Restaurant) => {
    if (restaurant.ownerId) {
      toast.error('Cette fiche a déjà un propriétaire.');
      return;
    }
    try {
      const claimed = await claim.mutateAsync(restaurant.id);
      await refreshRole();
      toast.success('Fiche officielle.');
      navigate(`/pro/restaurants/${claimed.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Revendication impossible.');
    }
  };

  if (mode === 'claim') {
    return (
      <div className="mx-auto max-w-3xl">
        <button type="button" className="text-sm text-ink-500" onClick={() => setMode('choose')}>
          ← Retour
        </button>
        <h1 className="mt-4 text-3xl font-bold text-ink-900">Revendiquer une fiche</h1>
        <p className="mt-2 text-sm text-ink-500">
          Cherchez votre établissement déjà listé (OSM ou EatNext). Ne créez pas de doublon.
        </p>
        <form
          className="mt-6 grid gap-3 sm:grid-cols-[1fr_10rem_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            setActiveQ(q.trim());
          }}
        >
          <Input
            label="Nom"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chez Wouassi…"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Ville</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
            >
              <option>Yaoundé</option>
              <option>Douala</option>
            </select>
          </div>
          <Button type="submit" className="self-end" loading={isFetching}>
            Chercher
          </Button>
        </form>

        <ul className="mt-6 space-y-2">
          {data?.items.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink-900">{r.name}</p>
                <p className="text-xs text-ink-400">
                  {r.address} · {r.city}
                </p>
                <SourceBadge restaurant={r} className="mt-1" />
              </div>
              {r.ownerId ? (
                <span className="text-xs text-ink-400">Déjà officielle</span>
              ) : (
                <Button size="sm" onClick={() => handleClaim(r)} loading={claim.isPending}>
                  C'est mon lieu
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Bienvenue</p>
      <h1 className="mt-2 text-4xl font-bold text-ink-900">Votre établissement sur EatNext</h1>
      <p className="mt-3 max-w-xl text-ink-500">
        Annuaire ouvert : existez d'abord, sans abonnement. Revendiquez une fiche OSM
        plutôt que d'en créer une seconde.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Choice
          index={0}
          icon={Search}
          title="Revendiquer"
          text="Votre table est déjà sur la carte (OSM ou EatNext)."
          onClick={() => setMode('claim')}
        />
        <Choice
          index={1}
          icon={MapPinned}
          title="Créer une fiche"
          text="Nouveau lieu, pas encore listé. Publié comme non vérifié."
          onClick={() => navigate('/pro/restaurants/new')}
        />
        <Choice
          index={2}
          icon={Building2}
          title="Plusieurs adresses"
          text="Créez la première, puis ajoutez les autres depuis le tableau de bord."
          onClick={() => navigate('/pro/restaurants/new?multi=1')}
        />
      </div>

      <p className="mt-8 text-sm text-ink-400">
        Déjà une fiche ? <Link to="/pro" className="text-brand-600 underline">Tableau de bord</Link>
      </p>
    </div>
  );
}

function Choice({
  icon: Icon,
  title,
  text,
  onClick,
  index,
}: {
  icon: typeof Search;
  title: string;
  text: string;
  onClick: () => void;
  index: number;
}) {
  return (
    <FadeIn delay={index * 0.04}>
      <button
        type="button"
        onClick={onClick}
        className="h-full w-full rounded-3xl border border-ink-100 bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
      >
        <Icon className="h-5 w-5 text-brand-600" />
        <p className="mt-4 text-xl font-semibold text-ink-900">{title}</p>
        <p className="mt-2 text-sm text-ink-500">{text}</p>
      </button>
    </FadeIn>
  );
}
