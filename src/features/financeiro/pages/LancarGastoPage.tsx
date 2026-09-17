import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../app/AppShell';
import { Topbar } from '../../../app/Topbar';
import { Card } from '../../../design-system/components/Card';
import { GastoForm } from '../components/GastoForm';
import { useCasal } from '../hooks/useCasal';
import { useGastos } from '../hooks/useGastos';

export function LancarGastoPage() {
  const navigate = useNavigate();
  const { criarGasto } = useGastos();
  const { membros, euSlug } = useCasal();

  async function handleSubmit(novo: Parameters<typeof criarGasto>[0]) {
    await criarGasto(novo);
    navigate('/');
  }

  return (
    <AppShell topbar={<Topbar eyebrow="NOVO LANÇAMENTO" title="Lançar gasto" />}>
      <Card>
        <GastoForm
          membros={membros}
          euSlug={euSlug}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/')}
        />
      </Card>
    </AppShell>
  );
}
