import { AppShell } from '../../../app/AppShell';
import { Topbar } from '../../../app/Topbar';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { LoadingState, ErrorState, EmptyState } from '../../../shared/components/AsyncState';
import { formatCurrency } from '../../../shared/lib/currency';
import { useCasal } from '../hooks/useCasal';
import { useSaldo } from '../hooks/useSaldo';
import { useSettleExpense } from '../hooks/useSettleExpense';
import { formatSaldoLabel } from '../lib/formatSaldo';
import { formatBalanceItemLabel } from '../lib/saldoItems';
import styles from './DetalheSaldoPage.module.css';

export function DetalheSaldoPage() {
  const { acaoError, quitar } = useSettleExpense();
  const { status, summary, error, recarregar } = useSaldo();
  const { labelDe } = useCasal();

  // Quitar changes which expenses compose the balance, and the balance is
  // computed server-side, so the summary has to be refetched after the
  // mutation rather than patched locally.
  const quitarERecarregar = async (id: string) => {
    await quitar(id);
    recarregar();
  };

  if (status === 'loading') {
    return (
      <AppShell topbar={<Topbar eyebrow="SALDO" title="Saldo entre vocês" />}>
        <LoadingState label="Carregando saldo..." />
      </AppShell>
    );
  }

  if (status === 'error' || !summary) {
    return (
      <AppShell topbar={<Topbar eyebrow="SALDO" title="Saldo entre vocês" />}>
        <ErrorState message={error ?? 'Algo deu errado.'} onRetry={recarregar} />
      </AppShell>
    );
  }

  const saldo = summary.balance;
  const items = summary.balanceItems;
  const quitado = !saldo.debtor || saldo.amount === 0;

  return (
    <AppShell topbar={<Topbar eyebrow="SALDO" title="Saldo entre vocês" />}>
      <Card>
        <span className={styles.summaryLabel}>Saldo atual</span>
        <span className={`${styles.summaryValue} ${quitado ? '' : styles.danger}`}>
          {formatSaldoLabel(saldo, labelDe)}
        </span>
      </Card>

      {acaoError && <ErrorState message={acaoError} />}

      <Card className={styles.itemsCard}>
        {items.length === 0 ? (
          <EmptyState>Nenhum lançamento pendente compõe o saldo.</EmptyState>
        ) : (
          items.map((item) => (
            <div key={item.expenseId} className={styles.itemRow}>
              <span>{formatBalanceItemLabel(item)}</span>
              <div className={styles.itemRight}>
                <span className={styles.itemValue}>{formatCurrency(item.amount)}</span>
                <Button variant="secondary" onClick={() => quitarERecarregar(item.expenseId)}>
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
