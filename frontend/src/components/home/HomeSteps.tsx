import { Search, Store, UtensilsCrossed } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';

const STEPS = [
  {
    icon: Search,
    title: 'Chercher',
    text: 'Ville, cuisine, distance — une barre, des chips, une carte.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Voir',
    text: 'Photos, avis, menu et prix en FCFA. Décidez en trois secondes.',
  },
  {
    icon: Store,
    title: 'Revendiquer',
    text: 'Votre table est déjà listée ? Prenez la fiche, sans paywall.',
  },
];

/**
 * Trois pas — rythme de scroll, cartes plus présentes.
 */
export function HomeSteps() {
  return (
    <section className="home-shell py-6">
      <FadeIn inView>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Parcours</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-900 sm:text-3xl">Comment ça marche</h2>
      </FadeIn>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <FadeIn key={step.title} inView delay={i * 0.08}>
            <div className="group h-full rounded-3xl border border-ink-100 bg-white p-5 shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-card-hover">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-800">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-bold text-brand-700">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{step.text}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
