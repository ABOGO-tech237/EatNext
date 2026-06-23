import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Home, LogOut, Menu, Search, User, UtensilsCrossed, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore, useIsAuthenticated } from '../../stores/authStore';
import { useAuthActions } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/search', label: 'Recherche', icon: Search },
  { to: '/favorites', label: 'Favoris', icon: Heart, protected: true },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-150',
    isActive
      ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100/80'
      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
  );

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
    isActive
      ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100'
      : 'text-ink-700 hover:bg-ink-50',
  );

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAuth = useIsAuthenticated();
  const user = useAuthStore((s) => s.user);
  const { logoutMutation } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();

  const closeMobile = () => setMobileOpen(false);
  const visibleLinks = navLinks.filter((l) => !l.protected || isAuth);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 8;
      setScrolled((prev) => (prev !== next ? next : prev));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-[box-shadow,background-color,border-color] duration-200',
        scrolled
          ? 'border-ink-100/80 bg-white/95 shadow-md backdrop-blur-lg'
          : 'border-transparent bg-white/90 shadow-sm backdrop-blur-md',
      )}
    >
      <div
        className="h-0.5 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400"
        aria-hidden
      />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm ring-1 ring-brand-600/20 transition-transform duration-200 group-hover:scale-105">
            <UtensilsCrossed className="h-4 w-4" aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-ink-900 transition-colors duration-150 group-hover:text-brand-700">
              EatNext
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-widest text-ink-400 sm:block">
              Cameroun
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navigation principale">
          {visibleLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          ))}
          {isAuth && (
            <NavLink to="/profile" className={navLinkClass}>
              <User className="h-4 w-4" aria-hidden />
              Profil
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuth ? (
            <>
              <Link
                to="/profile"
                className="hidden items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-ink-50 lg:flex"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 ring-2 ring-white">
                  {userInitial}
                </span>
                <span className="max-w-[120px] truncate text-sm text-ink-600">{user?.fullName}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                loading={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
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
          className="rounded-xl p-2 text-ink-600 transition-colors hover:bg-ink-100 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[4.125rem] z-40 bg-ink-900/20 md:hidden"
            onClick={closeMobile}
            aria-label="Fermer le menu"
          />
          <div className="relative z-50 border-t border-ink-100 bg-white animate-slide-down md:hidden">
            <div className="px-4 py-4">
              <nav className="space-y-1" aria-label="Navigation mobile">
                {visibleLinks.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={closeMobile}
                    className={mobileNavLinkClass}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    {label}
                  </NavLink>
                ))}
                {isAuth ? (
                  <NavLink to="/profile" onClick={closeMobile} className={mobileNavLinkClass}>
                    <User className="h-5 w-5" aria-hidden />
                    Profil
                  </NavLink>
                ) : (
                  <NavLink to="/login" onClick={closeMobile} className={mobileNavLinkClass}>
                    <User className="h-5 w-5" aria-hidden />
                    Connexion
                  </NavLink>
                )}
              </nav>

              <div className="mt-3 border-t border-ink-100 pt-3">
                {isAuth ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      logoutMutation.mutate();
                      closeMobile();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                ) : (
                  <div className="flex gap-2">
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
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
