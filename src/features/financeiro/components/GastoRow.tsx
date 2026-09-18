import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { Tag } from '../../../design-system/components/Tag';
import { formatCurrency } from '../../../shared/lib/currency';
import { CATEGORIES } from '../lib/types';
import type { Expense, Person } from '../lib/types';
import styles from './GastoRow.module.css';

interface GastoRowProps {
  gasto: Expense;
  /** Slug -> display name, from the session (`useCasal().labelDe`). */
  labelDe: (slug: Person) => string;
}

function ficaParaCada(gasto: Expense): string {
  if (gasto.split === 'individual') return 'Não abate';
  if (gasto.split === 'loan') {
    return gasto.countsTowardBalance ? formatCurrency(gasto.totalAmount) : 'Não abate';
  }
  return formatCurrency(gasto.totalAmount / 2);
}

function parcelaLabel(gasto: Expense): string {
  if (!gasto.isInstallment) return '—';
  const valor = gasto.installmentAmount !== null ? formatCurrency(gasto.installmentAmount) : '—';
  const pagas = gasto.paidInstallments ?? 0;
  return `${valor} (${pagas}/${gasto.totalInstallments ?? '?'})`;
}

/**
 * Read-only row: Histórico is a record of what was spent, not a place to act
 * on it. Quitar/reabrir/pagar live on the Pendências screen instead.
 */
export function GastoRow({ gasto, labelDe }: GastoRowProps) {
  const categoriaLabel = CATEGORIES.find((c) => c.value === gasto.category)?.label ?? gasto.category;
  const payerLabel = labelDe(gasto.paidBy);

  return (
    <div className={styles.row}>
      <span className={styles.date}>{gasto.date}</span>
      <span className={styles.desc}>{gasto.description}</span>
      <span>
        <Tag>{categoriaLabel}</Tag>
      </span>
      <span>{payerLabel}</span>
      <span className={styles.value}>{formatCurrency(gasto.totalAmount)}</span>
      <span className={styles.value}>{ficaParaCada(gasto)}</span>
      <span className={styles.value}>{parcelaLabel(gasto)}</span>
      <span>
        <StatusBadge status={gasto.status} />
      </span>
    </div>
  );
}
