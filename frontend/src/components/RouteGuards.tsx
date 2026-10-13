import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

function AuthLoading() {
  return <main className="auth-restore"><span className="auth-brand-mark">ভূ</span><span className="spinner" /><p>Restoring your secure session</p></main>;
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (user) {
    const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
    const destination = from?.pathname ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/';
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}