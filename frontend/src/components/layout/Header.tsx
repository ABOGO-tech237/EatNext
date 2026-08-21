import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Home, LogOut, Menu, Search, Store, User, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useAuthStore, useIsAuthenticated } from '../../stores/authStore';
import { useAuthActions } from '../../hooks/useAuth';
import { SearchBar } from '../search/SearchBar';
import { queryToSearchParams, searchParamsToQuery } from '../../lib/searchQuery';
import { BrandMark } from '../brand/BrandLogo';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/search', label: 'Recherche', icon: Search },
  { to: '/favorites', label: 'Favoris', icon: Heart, protected: true },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
    isActive
      ? 'bg-brand-50 text-brand-800 shadow-sm'
      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
  );

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-700 hover:bg-ink-50',
  );

/**
 * Header : logo, navbar, recherche compacte, compte.
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
  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const visibleLinks = navLinks.filter((l) => !l.protected || isAuth);

  const currentQ = location.pathname === '/search' ? urlParams.get('q') ?? '' : '';

  const submitSearch = (q: string) => {
    const current = location.pathname === '/search' ? queryToSearchParams(urlParams) : {};
    navigate(`/search?${searchParamsToQuery({ ...current, q: q || undefined })}`);
    closeMobile();
  };

  const liveSearch = useCallback(
    (q: string) => {
      if (location.pathname !== '/search') return;
      const current = queryToSearchParams(urlParams);
      if ((current.q ?? '') === q) return;
      navigate(`/search?${searchParamsToQuery({ ...current, q: q || undefined })}`, { replace: true });
    },
    [location.pathname, navigate, urlParams],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="EatNext by Crafti Studio — accueil"
        >
          <BrandMark className="h-8 w-7" />
          <span className="text-lg font-extrabold tracking-tight text-brand-800">EatNext</span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navigation principale">
          {visibleLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          ))}
          <NavLink to="/pro" className={navLinkClass}>
            <Store className="h-4 w-4" aria-hidden />
            {isOwner ? 'Mon établissement' : 'Restaurateurs'}
          </NavLink>
        </nav>

        <div className="hidden min-w-0 flex-1 lg:block">
          <SearchBar
            compact
            inputId="header-search-q"
            value={currentQ}
            onSubmit={submitSearch}
            onLiveQuery={liveSearch}
            className="w-full max-w-md ml-auto"
          />
        </div>

        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          {isAuth ? (
            <>
              <NavLink to="/profile" className={navLinkClass}>
                <User className="h-4 w-4" aria-hidden />
                <span className="hidden lg:inline">{user?.fullName?.split(' ')[0] || 'Profil'}</span>
              </NavLink>
              <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()} loading={logoutMutation.isPending}>
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline">Déconnexion</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Connexion
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                S'inscrire
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-ink-600 hover:bg-ink-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-100 bg-white px-4 py-3 md:hidden">
          <SearchBar
            compact
            inputId="header-search-q-mobile"
            value={currentQ}
            onSubmit={submitSearch}
            onLiveQuery={liveSearch}
            className="mb-3 w-full"
          />
          <nav className="space-y-1" aria-label="Navigation mobile">
            {visibleLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={closeMobile} className={mobileNavLinkClass}>
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </NavLink>
            ))}
            <NavLink to="/pro" onClick={closeMobile} className={mobileNavLinkClass}>
              <Store className="h-5 w-5" aria-hidden />
              {isOwner ? 'Mon établissement' : 'Restaurateurs'}
            </NavLink>
            {isAuth ? (
              <>
                <NavLink to="/profile" onClick={closeMobile} className={mobileNavLinkClass}>
                  <User className="h-5 w-5" aria-hidden />
                  Profil
                </NavLink>
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
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigate('/login');
                    closeMobile();
                  }}
                >
                  Connexion
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    navigate('/register');
                    closeMobile();
                  }}
                >
                  S'inscrire
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
