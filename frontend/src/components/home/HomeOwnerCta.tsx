import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { Button } from '../ui/Button';
import { FadeIn } from '../ui/FadeIn';
import { useIsAuthenticated } from '../../stores/authStore';

/** Bande restaurateur — plus bas dans le scroll, après les tables. */
export function HomeOwnerCta() {
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();

  return (
    <section className="px-4 pb-20 sm:px-6">
      <FadeIn inView className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-ink-900 px-6 py-12 text-white sm:px-12 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-600/40 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">Restaurateurs</p>
        <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
          Votre salle est déjà dans l’annuaire.
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-300 sm:text-base">
          Revendiquez la fiche, publiez le menu, répondez aux avis — sans paywall.
        </p>
        <Button
          size="lg"
          className="mt-8 bg-white text-ink-900 hover:bg-brand-50"
          onClick={() => navigate(isAuth ? '/pro/onboarding' : '/register?role=owner')}
        >
          <Store className="h-5 w-5" />
          Ouvrir la console
        </Button>
      </FadeIn>
    </section>
  );
}
