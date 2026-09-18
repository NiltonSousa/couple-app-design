import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { GoogleCallbackPage } from '../features/auth/pages/GoogleCallbackPage';
import { PainelPage } from '../features/financeiro/pages/PainelPage';
import { LancarGastoPage } from '../features/financeiro/pages/LancarGastoPage';
import { HistoricoPage } from '../features/financeiro/pages/HistoricoPage';
import { PendenciasPage } from '../features/financeiro/pages/PendenciasPage';
import type { ReactElement } from 'react';

function protegida(element: ReactElement): ReactElement {
  return <RequireAuth>{element}</RequireAuth>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/google/callback', element: <GoogleCallbackPage /> },
  { path: '/', element: protegida(<PainelPage />) },
  { path: '/lancar-gasto', element: protegida(<LancarGastoPage />) },
  { path: '/historico', element: protegida(<HistoricoPage />) },
  { path: '/pendencias', element: protegida(<PendenciasPage />) },
  // Old routes kept working so existing bookmarks/links don't break.
  { path: '/saldo', element: protegida(<PendenciasPage />) },
]);
