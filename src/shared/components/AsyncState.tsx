import type { ReactNode } from 'react';
import styles from './AsyncState.module.css';

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className={styles.state} role="status">
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={styles.retry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={styles.state}>{children}</div>;
}
