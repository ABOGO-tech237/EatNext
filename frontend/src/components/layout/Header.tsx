import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, LogOut, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, useIsAuthenticated } from '../../stores/authStore';
import { useAuthActions } from '../../hooks/useAuth';
import { SearchBar } from '../search/SearchBar';
import { queryToSearchParams, searchParamsToQuery } from '../../lib/searchQuery';
import { cn } from '../../lib/utils';

/**
 * Navbar utile : logo, recherche, favoris, compte.
 */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuth = useIsAuthenticated();
  const user = useAuthStore((s) => s.user);
  const { logoutMutation } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [urlParams] = useSearchParams();
  const closeMobile = () => setMobileOpen(false);

  const currentQ = location.pathname === '/search' ? urlParams.get('q') ?? '' : '';

  const submitSearch = (q: string) => {
    const current = location.pathname === '/search' ? queryToSearchParams(urlParams) : {};
    navigate(`/search?${searchParamsToQuery({ ...current, q: q || undefined })}`);
    closeMobile();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="EatNext — accueil">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            E
          </span>
          <span className="hidden text-lg font-bold tracking-tight text-ink-900 sm:inline">EatNext</span>
        </Link>

        <div className="min-w-0 flex-1">
          <SearchBar
            compact
            inputId="header-search-q"
            value={currentQ}
            onSubmit={submitSearch}
            className="w-full"
          />
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {isAuth && (
            <Link
              to="/favorites"
              className={cn(
                'rounded-xl p-2 text-ink-600 hover:bg-ink-50 hover:text-brand-700',
                location.pathname === '/favorites' && 'bg-brand-50 text-brand-700',
              )}
              aria-label="Favoris"
            >
              <Heart className="h-5 w-5" />
            </Link>
          )}

          {isAuth ? (
            <Link
              to="/profile"
              className={cn(
                'hidden rounded-xl p-2 text-ink-600 hover:bg-ink-50 hover:text-brand-700 sm:inline-flex',
                location.pathname === '/profile' && 'bg-brand-50 text-brand-700',
              )}
              aria-label="Profil"
            >
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <button
              type="button"
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 sm:inline"
              onClick={() => navigate('/login')}
            >
              Connexion
            </button>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 sm:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-100 bg-white px-4 py-3 sm:hidden">
          <nav className="space-y-1" aria-label="Menu">
            {isAuth ? (
              <>
                <Link
                  to="/favorites"
                  onClick={closeMobile}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  <Heart className="h-5 w-5" />
                  Favoris
                </Link>
                <Link
                  to="/profile"
                  onClick={closeMobile}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  <User className="h-5 w-5" />
                  Profil
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                  onClick={() => {
                    logoutMutation.mutate();
                    closeMobile();
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMobile}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                <User className="h-5 w-5" />
                Connexion
              </Link>
            )}
            <Link
              to="/pro"
              onClick={closeMobile}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-500 hover:bg-ink-50"
            >
              Espace pro
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
