import { AppShell } from '../../../app/AppShell';
import { Topbar } from '../../../app/Topbar';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { LoadingState, ErrorState, EmptyState } from '../../../shared/components/AsyncState';
import { useGastos } from '../hooks/useGastos';
import { computeSaldo } from '../lib/saldo';
import { formatSaldoLabel } from '../lib/formatSaldo';
import { saldoItems } from '../lib/saldoItems';
import styles from './DetalheSaldoPage.module.css';

export function DetalheSaldoPage() {
  const { status, gastos, error, quitar } = useGastos();

  if (status === 'loading') {
    return (
      <AppShell topbar={<Topbar eyebrow="SALDO" title="Saldo entre vocês" />}>
        <LoadingState label="Carregando saldo..." />
      </AppShell>
    );
  }

  if (status === 'error') {
    return (
      <AppShell topbar={<Topbar eyebrow="SALDO" title="Saldo entre vocês" />}>
        <ErrorState message={error ?? 'Algo deu errado.'} />
      </AppShell>
    );
  }

  const saldo = computeSaldo(gastos);
  const items = saldoItems(gastos);
  const quitado = !saldo.quemDeve || saldo.valor === 0;

  return (
    <AppShell topbar={<Topbar eyebrow="SALDO" title="Saldo entre vocês" />}>
      <Card>
        <span className={styles.summaryLabel}>Saldo atual</span>
        <span className={`${styles.summaryValue} ${quitado ? '' : styles.danger}`}>
          {formatSaldoLabel(saldo)}
        </span>
      </Card>

      <Card className={styles.itemsCard}>
        {items.length === 0 ? (
          <EmptyState>Nenhum lançamento pendente compõe o saldo.</EmptyState>
        ) : (
          items.map((item) => (
            <div key={item.gastoId} className={styles.itemRow}>
              <span>{item.descricao}</span>
              <div className={styles.itemRight}>
                <span className={styles.itemValue}>{item.valorFormatado}</span>
                <Button variant="secondary" onClick={() => quitar(item.gastoId)}>
                  Quitar
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </AppShell>
  );
}
