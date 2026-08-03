import { Link } from 'react-router-dom';
import {
  Compass,
  Heart,
  MapPin,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const values = [
  {
    icon: ShieldCheck,
    title: 'Avis vérifiés',
    description:
      'Chaque avis provient de membres inscrits, pour une information fiable et sans complaisance.',
  },
  {
    icon: Users,
    title: 'Portée communautaire',
    description:
      'Ce sont les gourmands locaux qui font vivre la plateforme, une adresse et une note à la fois.',
  },
  {
    icon: MapPin,
    title: 'Ancrage local',
    description:
      'Pensé pour le Cameroun : de la braise de quartier à la table gastronomique de Douala.',
  },
  {
    icon: Heart,
    title: 'Passion de la table',
    description:
      'Nous célébrons la cuisine camerounaise et toutes les saveurs qui font notre quotidien.',
  },
];

const steps = [
  {
    icon: Compass,
    title: 'Explorez',
    description:
      'Recherchez par ville, quartier, type de cuisine ou budget et parcourez la carte interactive.',
  },
  {
    icon: MessageSquareQuote,
    title: 'Partagez',
    description:
      'Laissez un avis, attribuez une note et racontez votre expérience pour guider les autres.',
  },
  {
    icon: Sparkles,
    title: 'Savourez',
    description:
      'Sauvegardez vos coups de cœur en favoris et retrouvez-les à chaque envie de sortie.',
  },
];

/**
 * Page « À propos » — présente la mission d'EatNext et son fonctionnement.
 * Contenu éditorial statique, cohérent avec l'identité de marque.
 */
export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-brand-50 ring-1 ring-white/20">
            <UtensilsCrossed className="h-4 w-4" aria-hidden />
            À propos d'EatNext
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            La bonne table n'est jamais loin.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-brand-100">
            EatNext est la plateforme communautaire de découverte de restaurants au Cameroun.
            De Douala à Yaoundé et bien au-delà, nous aidons chacun à trouver où bien manger,
            grâce aux avis sincères d'une communauté de passionnés.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-ink-900">Notre mission</h2>
          </div>
          <div className="space-y-4 text-ink-600 lg:col-span-2">
            <p className="leading-relaxed">
              Trouver un bon restaurant devrait être simple, où que l'on se trouve au Cameroun.
              Pourtant, les meilleures adresses se transmettent souvent de bouche à oreille et
              restent invisibles pour ceux qui ne connaissent pas encore le quartier.
            </p>
            <p className="leading-relaxed">
              Nous avons créé EatNext pour rassembler ces recommandations en un seul endroit :
              une plateforme claire, locale et fiable, portée par les avis vérifiés de sa
              communauté. Notre objectif est de mettre en lumière la richesse culinaire du pays,
              du maquis de quartier aux tables les plus raffinées.
            </p>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink-900">Comment ça marche ?</h2>
            <p className="mx-auto mt-2 max-w-xl text-ink-500">
              Trois étapes suffisent pour découvrir, partager et savourer.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="rounded-2xl border border-ink-100 bg-ink-50/50 p-6 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-brand-600">
                    Étape {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-ink-900">Nos valeurs</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-ink-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-8 text-center shadow-card sm:p-12">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <h2 className="relative text-2xl font-bold text-white">
            Rejoignez la communauté EatNext
          </h2>
          <p className="relative mx-auto mt-2 max-w-xl text-brand-100">
            Découvrez de nouvelles adresses, partagez vos coups de cœur et aidez les autres
            gourmands à mieux manger.
          </p>
          <div className="relative mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/search">
              <Button size="lg" variant="secondary" className="bg-white text-brand-700 hover:bg-brand-50">
                Explorer les restaurants
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:border-white hover:text-white">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
