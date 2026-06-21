import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useAuthStore } from '../../stores/authStore';
import { Spinner } from '../ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Garde de route — redirige vers /login si non authentifié.
 * Attend la réhydratation Zustand avant de décider.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuth = useIsAuthenticated();
  const hydrated = useAuthStore((s) => s.hydrated);
  const location = useLocation();

  if (!hydrated) return <Spinner className="min-h-[50vh]" />;

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
