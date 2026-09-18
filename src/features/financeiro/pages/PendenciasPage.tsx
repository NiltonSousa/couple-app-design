import { AppShell } from '../../../app/AppShell';
import { Topbar } from '../../../app/Topbar';
import { LoadingState, ErrorState, EmptyState } from '../../../shared/components/AsyncState';
import { SaldoCard } from '../components/SaldoCard';
import { useSaldo } from '../hooks/useSaldo';

/**
 * Every paydown action (quitar, pagar parcela, pagar parte) lives here —
 * Histórico is read-only. This is the only screen that mutates an expense's
 * payment status.
 */
export function PendenciasPage() {
  const { status, summary, error, recarregar } = useSaldo();

  if (status === 'loading') {
    return (
      <AppShell topbar={<Topbar eyebrow="PENDÊNCIAS" title="Pendências entre vocês" />}>
        <LoadingState label="Carregando pendências..." />
      </AppShell>
    );
  }

  if (status === 'error' || !summary) {
    return (
      <AppShell topbar={<Topbar eyebrow="PENDÊNCIAS" title="Pendências entre vocês" />}>
        <ErrorState message={error ?? 'Algo deu errado.'} onRetry={recarregar} />
      </AppShell>
    );
  }

  if (status === 'empty') {
    return (
      <AppShell topbar={<Topbar eyebrow="PENDÊNCIAS" title="Pendências entre vocês" />}>
        <EmptyState>Nenhuma pendência — está tudo quitado.</EmptyState>
      </AppShell>
    );
  }

  return (
    <AppShell topbar={<Topbar eyebrow="PENDÊNCIAS" title="Pendências entre vocês" />}>
      <SaldoCard summary={summary} onPago={recarregar} />
    </AppShell>
  );
}
