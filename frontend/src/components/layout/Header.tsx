import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Heart, Home, LogOut, Menu, Search, User, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, useIsAuthenticated } from '../../stores/authStore';
import { useAuthActions } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

/**
 * Liens de navigation principaux affichés dans le header.
 * Les routes protégées (Favoris, Profil) ne s'affichent que si l'utilisateur est connecté.
 */
const navLinks = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/search', label: 'Recherche', icon: Search },
  { to: '/favorites', label: 'Favoris', icon: Heart, protected: true },
];

/** Classes communes pour les liens actifs / inactifs (desktop + mobile). */
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-700 shadow-sm'
      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
  );

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50',
  );

/**
 * En-tête sticky avec navigation principale et menu hamburger sur mobile.
 * Style chaleureux : fond blanc légèrement flouté, logo rouge EatNext, ombre discrète.
 */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuth = useIsAuthenticated();
  const user = useAuthStore((s) => s.user);
  const { logoutMutation } = useAuthActions();
  const navigate = useNavigate();

  /** Ferme le drawer mobile après navigation (évite un menu ouvert sur la nouvelle page). */
  const closeMobile = () => setMobileOpen(false);

  const visibleLinks = navLinks.filter((l) => !l.protected || isAuth);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo / marque — retour à l'accueil */}
        <Link to="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white transition-transform group-hover:scale-105">
            E
          </span>
          <span className="text-xl font-bold tracking-tight text-ink-900 transition-colors group-hover:text-brand-700">
            EatNext
          </span>
        </Link>

        {/* Navigation desktop — masquée sous md, remplacée par le menu hamburger */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
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

        {/* Actions auth desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuth ? (
            <>
              <span className="hidden text-sm text-ink-500 lg:inline">{user?.fullName}</span>
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

        {/* Bouton hamburger — visible uniquement sur mobile */}
        <button
          type="button"
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Panneau mobile — s'ouvre sous le header sticky */}
      {mobileOpen && (
        <div className="border-t border-ink-100 bg-white px-4 py-3 md:hidden">
          <nav className="space-y-1" aria-label="Navigation mobile">
            {visibleLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={closeMobile} className={mobileNavLinkClass}>
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

          <div className="mt-2 border-t border-ink-100 pt-2">
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
      )}
    </header>
  );
}
