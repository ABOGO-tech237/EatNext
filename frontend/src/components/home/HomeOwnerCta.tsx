import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { Button } from '../ui/Button';
import { FadeIn } from '../ui/FadeIn';
import { OWNER_COVER } from '../../lib/covers';
import { useIsAuthenticated } from '../../stores/authStore';

/** Bande restaurateur — photo de salle + overlay forêt Crafti. */
export function HomeOwnerCta() {
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();

  return (
    <section className="home-shell pb-20">
      <FadeIn inView className="relative overflow-hidden rounded-3xl bg-brand-800 text-white">
        <img
          src={OWNER_COVER}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#08341F]/92 via-[#08341F]/78 to-[#08341F]/45" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mint-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-accent-600/20 blur-3xl" />
        <div className="relative px-6 py-12 sm:px-12 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-500">Restaurateurs</p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            Votre salle est déjà dans l’annuaire.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
            Revendiquez la fiche, publiez le menu, répondez aux avis — sans paywall.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-white text-brand-800 hover:bg-mint-500"
            onClick={() => navigate(isAuth ? '/pro/onboarding' : '/register?role=owner')}
          >
            <Store className="h-5 w-5" />
            Ouvrir la console
          </Button>
        </div>
      </FadeIn>
    </section>
  );
}
