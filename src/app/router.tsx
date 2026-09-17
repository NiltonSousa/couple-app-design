import { createBrowserRouter } from 'react-router-dom';
import { PainelPage } from '../features/financeiro/pages/PainelPage';
import { LancarGastoPage } from '../features/financeiro/pages/LancarGastoPage';
import { HistoricoPage } from '../features/financeiro/pages/HistoricoPage';
import { DetalheSaldoPage } from '../features/financeiro/pages/DetalheSaldoPage';

export const router = createBrowserRouter([
  { path: '/', element: <PainelPage /> },
  { path: '/lancar-gasto', element: <LancarGastoPage /> },
  { path: '/historico', element: <HistoricoPage /> },
  { path: '/saldo', element: <DetalheSaldoPage /> },
]);
