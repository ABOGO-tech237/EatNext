import { NavLink } from 'react-router-dom';
import { Heart, Home, Search, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIsAuthenticated } from '../../stores/authStore';

const items = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/search', label: 'Recherche', icon: Search },
  { to: '/favorites', label: 'Favoris', icon: Heart, auth: true },
  { to: '/profile', label: 'Compte', icon: User, guestTo: '/login' },
] as const;

/**
 * Bottom nav compacte (Material 3 Navigation bar) — mobile only.
 */
export function MobileBottomNav() {
  const isAuth = useIsAuthenticated();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Navigation principale mobile"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 py-1">
        {items.map((item) => {
          const to = 'guestTo' in item && !isAuth ? item.guestTo : item.to;
          if ('auth' in item && item.auth && !isAuth) {
            return (
              <li key={item.to}>
                <NavLink
                  to="/login"
                  className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium text-ink-500"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          }
          return (
            <li key={item.to}>
              <NavLink
                to={to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors',
                    isActive ? 'text-brand-800' : 'text-ink-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                        isActive && 'bg-brand-50',
                      )}
                    >
                      <item.icon className="h-5 w-5" aria-hidden />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
