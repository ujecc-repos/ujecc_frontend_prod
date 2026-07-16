import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Auth/auth';

export default function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== 'Admin') {
    return <Navigate to="/tableau-de-bord" replace />;
  }

  return children;
}
