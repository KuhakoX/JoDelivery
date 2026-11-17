import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function LoadingPage() {
  return <main className="centered"><p role="status">Carregando...</p></main>;
}

export function ProtectedRoute() {
  const { session, loading, sessionError } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingPage />;
  if (sessionError) {
    return <main className="centered"><p className="notice error" role="alert">Não foi possível verificar sua sessão: {sessionError}</p></main>;
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function GuestRoute() {
  const { session, loading, sessionError } = useAuth();
  if (loading) return <LoadingPage />;
  if (sessionError) {
    return <main className="centered"><p className="notice error" role="alert">Não foi possível verificar sua sessão: {sessionError}</p></main>;
  }
  return session ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export function AdminRoute() {
  const { isAdmin, roleLoading, roleError } = useAuth();
  if (roleLoading) return <LoadingPage />;
  if (roleError) {
    return <main className="centered"><p className="notice error">Não foi possível verificar as permissões: {roleError}</p></main>;
  }
  return isAdmin ? <Outlet /> : <Navigate to="/products" replace />;
}
