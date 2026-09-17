import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { PainelPage } from '../features/financeiro/pages/PainelPage';
import { LancarGastoPage } from '../features/financeiro/pages/LancarGastoPage';
import { HistoricoPage } from '../features/financeiro/pages/HistoricoPage';
import { DetalheSaldoPage } from '../features/financeiro/pages/DetalheSaldoPage';
import type { ReactElement } from 'react';

function protegida(element: ReactElement): ReactElement {
  return <RequireAuth>{element}</RequireAuth>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: protegida(<PainelPage />) },
  { path: '/lancar-gasto', element: protegida(<LancarGastoPage />) },
  { path: '/historico', element: protegida(<HistoricoPage />) },
  { path: '/saldo', element: protegida(<DetalheSaldoPage />) },
]);
