import styles from './StatusBadge.module.css';

type Status = 'pending' | 'partial_paid' | 'settled';

interface StatusBadgeProps {
  status: Status;
}

const LABEL: Record<Status, string> = {
  pending: 'Pendente',
  partial_paid: 'Parcial',
  settled: 'Quitado',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
