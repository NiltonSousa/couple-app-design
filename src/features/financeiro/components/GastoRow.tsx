import { Button } from '../../../design-system/components/Button';
import { StatusBadge } from '../../../design-system/components/StatusBadge';
import { Tag } from '../../../design-system/components/Tag';
import { formatCurrency } from '../../../shared/lib/currency';
import { CATEGORIAS, PESSOAS } from '../lib/types';
import type { Gasto } from '../lib/types';
import styles from './GastoRow.module.css';

interface GastoRowProps {
  gasto: Gasto;
  onQuitar: (id: string) => void;
  onReabrir: (id: string) => void;
}

function ficaParaCada(gasto: Gasto): string {
  if (gasto.divisao === 'individual') return 'Não abate';
  if (gasto.divisao === 'emprestimo') {
    return gasto.abaterNoSaldo ? formatCurrency(gasto.valorTotal) : 'Não abate';
  }
  return formatCurrency(gasto.valorTotal / 2);
}

export function GastoRow({ gasto, onQuitar, onReabrir }: GastoRowProps) {
  const categoriaLabel = CATEGORIAS.find((c) => c.value === gasto.categoria)?.label ?? gasto.categoria;
  const payerLabel = PESSOAS.find((p) => p.value === gasto.pagoPor)?.label ?? gasto.pagoPor;

  return (
    <div className={styles.row}>
      <span className={styles.date}>{gasto.data}</span>
      <span className={styles.desc}>{gasto.descricao}</span>
      <span>
        <Tag>{categoriaLabel}</Tag>
      </span>
      <span>{payerLabel}</span>
      <span className={styles.value}>{formatCurrency(gasto.valorTotal)}</span>
      <span className={styles.value}>{ficaParaCada(gasto)}</span>
      <span>
        <StatusBadge status={gasto.status} />
      </span>
      <span>
        {gasto.status === 'pendente' ? (
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
