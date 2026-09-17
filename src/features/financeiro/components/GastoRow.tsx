import { Button } from '../../../design-system/components/Button';
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
  onQuitar: (id: string) => void;
  onReabrir: (id: string) => void;
}

function ficaParaCada(gasto: Expense): string {
  if (gasto.split === 'individual') return 'Não abate';
  if (gasto.split === 'loan') {
    return gasto.countsTowardBalance ? formatCurrency(gasto.totalAmount) : 'Não abate';
  }
  return formatCurrency(gasto.totalAmount / 2);
}

export function GastoRow({ gasto, labelDe, onQuitar, onReabrir }: GastoRowProps) {
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
      <span>
        <StatusBadge status={gasto.status} />
      </span>
      <span>
        {gasto.status === 'pending' ? (
          <Button variant="secondary" onClick={() => onQuitar(gasto.id)}>
            Quitar
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => onReabrir(gasto.id)}>
            Reabrir
          </Button>
        )}
      </span>
    </div>
  );
}
