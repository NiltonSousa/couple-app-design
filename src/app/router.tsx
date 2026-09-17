import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { PainelPage } from '../features/financeiro/pages/PainelPage';
import { LancarGastoPage } from '../features/financeiro/pages/LancarGastoPage';
import { HistoricoPage } from '../features/financeiro/pages/HistoricoPage';
import type { ReactElement } from 'react';

function protegida(element: ReactElement): ReactElement {
  return <RequireAuth>{element}</RequireAuth>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: protegida(<PainelPage />) },
  { path: '/lancar-gasto', element: protegida(<LancarGastoPage />) },
  { path: '/historico', element: protegida(<HistoricoPage />) },
  // /saldo was folded into /historico — the balance is just a different
  // view of the same expense list (see SaldoCard).
  { path: '/saldo', element: protegida(<HistoricoPage />) },
]);
