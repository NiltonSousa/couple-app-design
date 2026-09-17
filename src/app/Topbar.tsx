import type { ReactNode } from 'react';
import styles from './Topbar.module.css';

interface TopbarProps {
  eyebrow: string;
  title: string;
  /** Right-side slot, e.g. a balance Pill and/or a primary action Button. */
  actions?: ReactNode;
  onMenuClick?: () => void;
}

export function Topbar({ eyebrow, title, actions, onMenuClick }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {onMenuClick && (
          <button
            type="button"
            className={styles.menuButton}
            onClick={onMenuClick}
            aria-label="Abrir menu de navegação"
          >
            ☰
          </button>
        )}
        <div className={styles.titleStack}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>
      {actions && <div className={styles.right}>{actions}</div>}
    </header>
  );
}
