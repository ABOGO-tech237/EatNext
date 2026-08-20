import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useAuthStore } from '../../stores/authStore';
import { Spinner } from '../ui/Spinner';

/**
 * Console pro : authentification requise.
 * Les diners (`user`) peuvent entrer pour revendiquer / créer (upgrade).
 */
export function OwnerRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useIsAuthenticated();
  const hydrated = useAuthStore((s) => s.hydrated);
  const location = useLocation();

  if (!hydrated) return <Spinner className="min-h-[50vh]" />;
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
