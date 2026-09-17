import styles from './StatusBadge.module.css';

type Status = 'pendente' | 'quitado';

interface StatusBadgeProps {
  status: Status;
}

const LABEL: Record<Status, string> = {
  pendente: 'Pendente',
  quitado: 'Quitado',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
