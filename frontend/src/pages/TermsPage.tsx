import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

const LAST_UPDATED = '8 juillet 2026';

const sections = [
  {
    title: 'Objet',
    paragraphs: [
      "Les présentes Conditions Générales d'Utilisation (« CGU ») ont pour objet de définir les modalités et conditions d'accès et d'utilisation de la plateforme EatNext (le « Service »), qui permet de découvrir des restaurants au Cameroun, de consulter et de publier des avis.",
      "En accédant au Service, vous reconnaissez avoir pris connaissance des présentes CGU et vous engagez à les respecter.",
    ],
  },
  {
    title: 'Acceptation des conditions',
    paragraphs: [
      "L'utilisation d'EatNext implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.",
      "EatNext se réserve le droit de refuser l'accès au Service, unilatéralement et sans notification préalable, à tout utilisateur ne respectant pas les présentes conditions.",
    ],
  },
  {
    title: 'Comptes utilisateurs',
    paragraphs: [
      "Certaines fonctionnalités, comme la publication d'avis ou l'enregistrement de favoris, nécessitent la création d'un compte. Vous vous engagez à fournir des informations exactes et à les maintenir à jour.",
      "Vous êtes seul responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte. En cas d'utilisation non autorisée, vous devez en informer EatNext sans délai.",
    ],
  },
  {
    title: 'Contenu et avis',
    paragraphs: [
      "Les avis publiés doivent refléter une expérience réelle et sincère. Sont notamment interdits les propos diffamatoires, injurieux, discriminatoires, mensongers ou contraires à la loi, ainsi que tout contenu publicitaire non sollicité.",
      "EatNext se réserve le droit de modérer, masquer ou supprimer tout contenu ne respectant pas ces règles, sans que cela n'ouvre droit à une quelconque indemnité.",
    ],
  },
  {
    title: 'Propriété intellectuelle',
    paragraphs: [
      "La plateforme, sa charte graphique, ses logos et l'ensemble de ses éléments sont protégés par le droit de la propriété intellectuelle et demeurent la propriété exclusive d'EatNext.",
      "En publiant un contenu sur le Service, vous concédez à EatNext une licence non exclusive et gratuite lui permettant d'afficher et de diffuser ce contenu dans le cadre du fonctionnement de la plateforme.",
    ],
  },
  {
    title: 'Données personnelles',
    paragraphs: [
      "EatNext collecte et traite certaines données personnelles nécessaires au fonctionnement du Service, dans le respect de la réglementation applicable. Ces données ne sont ni vendues ni cédées à des tiers à des fins commerciales.",
      "Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Toute demande peut être adressée à l'adresse indiquée dans la rubrique « Contact ».",
    ],
  },
  {
    title: 'Responsabilité',
    paragraphs: [
      "EatNext s'efforce d'assurer l'exactitude des informations diffusées, mais ne saurait garantir l'exhaustivité ou l'actualité des données relatives aux restaurants référencés, ni la disponibilité ininterrompue du Service.",
      "Les avis reflètent l'opinion de leurs auteurs et n'engagent pas la responsabilité d'EatNext. L'utilisateur reste seul responsable de ses choix et de l'usage qu'il fait des informations disponibles sur la plateforme.",
    ],
  },
  {
    title: 'Modification des CGU',
    paragraphs: [
      "EatNext se réserve le droit de modifier les présentes CGU à tout moment afin de les adapter à l'évolution du Service ou de la réglementation. Les utilisateurs seront informés de toute modification substantielle.",
      "La poursuite de l'utilisation du Service après la mise à jour des CGU vaut acceptation des nouvelles conditions.",
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      "Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l'adresse contact@eatnext.africa ou via notre page de contact.",
    ],
  },
];

/**
 * Page « CGU » — Conditions Générales d'Utilisation.
 * Contenu éditorial statique structuré en sections numérotées.
 */
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FileText className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-ink-900">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-sm text-ink-400">Dernière mise à jour : {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-card sm:p-10">
        <p className="text-ink-600 leading-relaxed">
          Bienvenue sur EatNext. Les présentes conditions encadrent votre utilisation de notre
          plateforme de découverte de restaurants au Cameroun. Nous vous invitons à les lire
          attentivement.
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-ink-900">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-2 space-y-3">
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-sm leading-relaxed text-ink-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-ink-100 pt-6 text-sm text-ink-500">
          Une question sur ces conditions ?{' '}
          <Link to="/contact" className="font-medium text-brand-600 hover:underline">
            Contactez-nous
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
