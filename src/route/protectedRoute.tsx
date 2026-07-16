// ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../Auth/auth';

export default function ProtectedRoute() {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
          <p className="text-sm font-medium text-slate-500">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (user.role === 'Membre') {
    const memberRouteAllowed =
      location.pathname === '/tableau-de-bord/messagerie' ||
      location.pathname === '/tableau-de-bord/evenements' ||
      location.pathname.startsWith('/tableau-de-bord/evenements/');

    if (!memberRouteAllowed) {
      return <Navigate to="/tableau-de-bord/messagerie" replace />;
    }
  }

  return <Outlet />;
}
