import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'danger';
}

export function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${styles[tone]}`}>{value}</span>
    </div>
  );
}
