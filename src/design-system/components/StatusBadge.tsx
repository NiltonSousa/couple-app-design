import styles from './StatusBadge.module.css';

type Status = 'pending' | 'settled';

interface StatusBadgeProps {
  status: Status;
}

const LABEL: Record<Status, string> = {
  pending: 'Pendente',
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
