import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Plus, Store } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
    isActive ? 'bg-brand-600 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white',
  );

/** Console restaurateur — densité Linear, accents rouge EatNext. */
export function ProLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="hidden w-60 shrink-0 flex-col bg-ink-900 text-white md:flex">
        <Link to="/pro" className="flex items-center gap-2 px-5 py-5 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
            E
          </span>
          EatNext Pro
        </Link>
        <nav className="flex-1 space-y-1 px-3" aria-label="Console restaurateur">
          <NavLink to="/pro" end className={linkClass}>
            <LayoutDashboard className="h-4 w-4" />
            Tableau de bord
          </NavLink>
          <NavLink to="/pro/onboarding" className={linkClass}>
            <Store className="h-4 w-4" />
            Ajouter un lieu
          </NavLink>
          <NavLink to="/pro/restaurants/new" className={linkClass}>
            <Plus className="h-4 w-4" />
            Créer une fiche
          </NavLink>
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs text-ink-400">
          <p className="text-white">{user?.fullName}</p>
          <Link to="/" className="mt-2 inline-block text-brand-400 hover:underline">
            ← Retour diner
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 md:hidden">
          <Link to="/pro" className="font-bold text-ink-900">
            EatNext Pro
          </Link>
          <Link to="/pro/onboarding" className="text-sm text-brand-600">
            Ajouter
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
