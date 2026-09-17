import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../../shared/components/AsyncState';
import { useAuth } from '../hooks/authContext';

/**
 * Gate for every authenticated route. It also covers the 401-mid-session case:
 * the auth provider drops the session on any 401, this component re-renders as
 * 'anonymous' and redirects, carrying the current path so login can return to it.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, error, revalidar } = useAuth();
  const location = useLocation();

  if (status === 'checking') {
    return <LoadingState label="Validando sua sessão..." />;
  }

  if (status === 'anonymous') {
    if (error) {
      return <ErrorState message={error} onRetry={revalidar} />;
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
