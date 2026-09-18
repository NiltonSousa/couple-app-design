import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { EmptyState, ErrorState } from '../../../shared/components/AsyncState';
import { formatCurrency } from '../../../shared/lib/currency';
import { useCasal } from '../hooks/useCasal';
import { useSettleExpense } from '../hooks/useSettleExpense';
import { formatSaldoLabel } from '../lib/formatSaldo';
import { formatBalanceItemLabel, formatInstallmentAmountLabel } from '../lib/saldoItems';
import type { Summary } from '../lib/types';
import { PartialPayControl } from './PartialPayControl';
import styles from './SaldoCard.module.css';

interface SaldoCardProps {
  summary: Summary;
  /** Called after any paydown action (quitar, pagar parcela, pagar parte) succeeds. */
  onPago: () => void;
}

/**
 * The aggregate balance plus the list of expenses composing it, with the
 * quitar/pagar actions. Fixed at the top of Histórico rather than its own
 * route — the balance is just a different view of the same expense list, so
 * splitting it out forced an extra navigation to see why a number was what
 * it was.
 */
export function SaldoCard({ summary, onPago }: SaldoCardProps) {
  const { acaoError, quitar, pagarParcela, pagarParte } = useSettleExpense();
  const { labelDe } = useCasal();

  const quitarEAtualizar = async (id: string) => {
    await quitar(id);
    onPago();
  };

  const pagarParcelaEAtualizar = async (id: string) => {
    await pagarParcela(id);
    onPago();
  };

  const pagarParteEAtualizar = async (id: string, valor: number) => {
    await pagarParte(id, valor);
    onPago();
  };

  const saldo = summary.balance;
  const items = summary.balanceItems;
  const quitado = !saldo.debtor || saldo.amount === 0;

  return (
    <>
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
              <span className={styles.itemLeft}>
                <span>{formatBalanceItemLabel(item)}</span>
                {formatInstallmentAmountLabel(item) && (
                  <span className={styles.itemMeta}>{formatInstallmentAmountLabel(item)}</span>
                )}
              </span>
              <div className={styles.itemRight}>
                <span className={styles.itemValue}>{formatCurrency(item.amount)}</span>
                <PartialPayControl
                  item={item}
                  onPagarParcela={() => pagarParcelaEAtualizar(item.expenseId)}
                  onPagarParte={(valor) => pagarParteEAtualizar(item.expenseId, valor)}
                />
                <Button variant="secondary" onClick={() => quitarEAtualizar(item.expenseId)}>
                  Quitar
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
