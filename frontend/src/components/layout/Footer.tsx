import { Link } from 'react-router-dom';

/**
 * Pied de page aligné sur develop — blanc / ink, liens réels.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-ink-200 bg-gradient-to-b from-white to-ink-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                E
              </span>
              <p className="text-lg font-bold text-ink-900">EatNext</p>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
              Découvrez les meilleurs restaurants du Cameroun — avis, cartes et favoris en un
              clic. Prix en FCFA.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-700">Explorer</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/search" className="text-sm text-ink-500 transition-colors hover:text-brand-600">
                  Trouver une table
                </Link>
              </li>
              <li>
                <Link
                  to="/search?city=Yaoundé"
                  className="text-sm text-ink-500 transition-colors hover:text-brand-600"
                >
                  Yaoundé
                </Link>
              </li>
              <li>
                <Link
                  to="/search?city=Douala"
                  className="text-sm text-ink-500 transition-colors hover:text-brand-600"
                >
                  Douala
                </Link>
              </li>
              <li>
                <Link to="/pro" className="text-sm text-ink-500 transition-colors hover:text-brand-600">
                  Inscrire mon restaurant
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-700">Maison</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/a-propos" className="text-sm text-ink-500 transition-colors hover:text-brand-600">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-ink-500 transition-colors hover:text-brand-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/cgu" className="text-sm text-ink-500 transition-colors hover:text-brand-600">
                  CGU
                </Link>
              </li>
            </ul>
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
