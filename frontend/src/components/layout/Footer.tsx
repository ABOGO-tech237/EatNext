import { Link } from 'react-router-dom';
import { Facebook, Heart, Instagram, Mail, MapPin, Search, Twitter, UtensilsCrossed } from 'lucide-react';

const footerLinks = [
  { label: 'À propos', to: '/a-propos' },
  { label: 'Contact', to: '/contact' },
  { label: 'CGU', to: '/cgu' },
];

const socialLinks = [
  { label: 'Facebook', icon: Facebook },
  { label: 'Instagram', icon: Instagram },
  { label: 'Twitter', icon: Twitter },
  { label: 'Email', icon: Mail },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-white">Prêt à découvrir ?</p>
            <p className="mt-1 text-sm text-brand-100">
              Des centaines de restaurants vous attendent au Cameroun.
            </p>
          </div>
          <Link
            to="/search"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-md active:translate-y-0"
          >
            <Search className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" />
            Explorer les restaurants
          </Link>
        </div>
      </div>

      <div className="relative border-t border-ink-200 bg-gradient-to-b from-white to-ink-50">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-100/40 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
                  <UtensilsCrossed className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-lg font-bold text-ink-900">EatNext</p>
                  <p className="flex items-center gap-1 text-xs text-ink-400">
                    <MapPin className="h-3 w-3" aria-hidden />
                    Yaoundé · Douala · Cameroun
                  </p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
                Découvrez les meilleurs restaurants du Cameroun — avis vérifiés, cartes
                interactives et favoris personnalisés, le tout en un clic.
              </p>
            </div>

            <div className="lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                Liens utiles
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link
                    to="/search"
                    className="group inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-brand-600"
                  >
                    <span className="h-px w-0 bg-brand-400 transition-all duration-150 group-hover:w-3" />
                    Rechercher un restaurant
                  </Link>
                </li>
                {footerLinks.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="group inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-brand-600"
                    >
                      <span className="h-px w-0 bg-brand-400 transition-all duration-150 group-hover:w-3" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                Suivez-nous
              </p>
              <p className="mt-2 text-sm text-ink-500">
                Restez informé des nouveautés et des coups de cœur locaux.
              </p>
              <div className="mt-4 flex gap-3">
                {socialLinks.map(({ label, icon: Icon }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    title={`${label} — bientôt disponible`}
                    className="group flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 shadow-sm transition-[transform,box-shadow,border-color,background-color,color] duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 hover:shadow-md active:translate-y-0"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Icon
                      className="h-4 w-4 transition-transform duration-150 group-hover:scale-110"
                      aria-hidden
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 sm:flex-row">
            <p className="text-xs text-ink-400">© {year} EatNext. Tous droits réservés.</p>
            <p className="flex items-center gap-1 text-xs text-ink-400">
              Fait avec
              <Heart className="h-3 w-3 fill-brand-400 text-brand-400" aria-hidden />
              au Cameroun
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
