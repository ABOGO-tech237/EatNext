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
 * Trois pas — remplace le split diner / restaurateur.
 */
export function HomeSteps() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6">
      <FadeIn inView>
        <h2 className="text-xl font-semibold text-ink-900">Comment ça marche</h2>
      </FadeIn>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <FadeIn key={step.title} inView delay={i * 0.04}>
            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <step.icon className="h-5 w-5 text-brand-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{step.text}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
