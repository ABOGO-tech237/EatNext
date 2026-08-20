import { Link } from 'react-router-dom';
import { Plus, Star, MessageSquare } from 'lucide-react';
import { useMyRestaurants } from '../../hooks/useRestaurants';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { SourceBadge } from '../../components/restaurant/SourceBadge';
import { formatRating } from '../../lib/utils';
import { FadeIn } from '../../components/ui/FadeIn';
import { staggerDelay } from '../../lib/motion';

export default function ProDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMyRestaurants();
  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Console</p>
          <h1 className="mt-1 text-3xl font-bold text-ink-900">Mes établissements</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/pro/onboarding">
            <Button variant="outline">Revendiquer</Button>
          </Link>
          <Link to="/pro/restaurants/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvelle fiche
            </Button>
          </Link>
        </div>
      </div>

      {user?.role === 'user' && items.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
          <p className="text-2xl font-bold text-ink-900">Passez restaurateur</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Revendiquez une fiche existante ou créez la vôtre. Votre compte sera
            promu automatiquement.
          </p>
          <Link to="/pro/onboarding" className="mt-6 inline-block">
            <Button>Commencer</Button>
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : items.length === 0 && user?.role !== 'user' ? (
        <div className="mt-8 rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
          <p className="text-2xl font-bold">Aucune fiche pour l'instant</p>
          <p className="mt-2 text-sm text-ink-500">
            Trois chemins : revendiquer un OSM, créer, ou gérer plusieurs adresses.
          </p>
          <Link to="/pro/onboarding" className="mt-6 inline-block">
            <Button>Ajouter un lieu</Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((r, i) => (
            <li key={r.id}>
              <FadeIn delay={staggerDelay(i)}>
                <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link to={`/pro/restaurants/${r.id}`} className="text-xl font-semibold text-ink-900 hover:underline">
                        {r.name}
                      </Link>
                      <p className="mt-1 text-sm text-ink-400">
                        {r.city} · {r.address}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <SourceBadge restaurant={r} />
                        <span className="text-xs uppercase tracking-wide text-ink-400">{r.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-ink-600">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400" />
                        {formatRating(r.avgRating)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {r.reviewCount}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <Link className="text-brand-600 hover:underline" to={`/pro/restaurants/${r.id}`}>
                      Éditer
                    </Link>
                    <Link className="text-brand-600 hover:underline" to={`/pro/restaurants/${r.id}/menu`}>
                      Menu
                    </Link>
                    <Link className="text-brand-600 hover:underline" to={`/pro/restaurants/${r.id}/reviews`}>
                      Avis
                    </Link>
                    <Link className="text-ink-400 hover:underline" to={`/restaurants/${r.id}`}>
                      Voir la fiche publique
                    </Link>
                  </div>
                </div>
              </FadeIn>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
