import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Twitter } from 'lucide-react';

/**
 * Liens du pied de page — placeholders pour les pages légales à venir.
 * href="#" en attendant les vraies routes / contenus statiques.
 */
const footerLinks = [
  { label: 'À propos', href: '#a-propos' },
  { label: 'Contact', href: '#contact' },
  { label: 'CGU', href: '#cgu' },
];

/** Icônes réseaux sociaux — placeholders cliquables sans URL externe pour l'instant. */
const socialLinks = [
  { label: 'Facebook', icon: Facebook },
  { label: 'Instagram', icon: Instagram },
  { label: 'Twitter', icon: Twitter },
  { label: 'Email', icon: Mail },
];

/**
 * Pied de page chaleureux, aligné visuellement avec le header (palette brand + ink).
 * Reste en bas grâce au flex-col du MainLayout (mt-auto).
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-ink-200 bg-gradient-to-b from-white to-ink-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Marque et accroche */}
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                E
              </span>
              <p className="text-lg font-bold text-ink-900">EatNext</p>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
              Découvrez les meilleurs restaurants du Cameroun — avis, cartes et favoris en un
              clic.
            </p>
          </div>

          {/* Liens utiles */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-700">
              Liens utiles
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/search"
                  className="text-sm text-ink-500 transition-colors hover:text-brand-600"
                >
                  Rechercher un restaurant
                </Link>
              </li>
              {footerLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-ink-500 transition-colors hover:text-brand-600"
                    onClick={(e) => e.preventDefault()}
                    title={`${label} — bientôt disponible`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Réseaux sociaux — placeholders */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-700">
              Suivez-nous
            </p>
            <div className="mt-3 flex gap-3">
              {socialLinks.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  title={`${label} — bientôt disponible`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                  onClick={(e) => e.preventDefault()}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-ink-100 pt-6">
          <p className="text-center text-xs text-ink-400 sm:text-left">
            © {year} EatNext. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
