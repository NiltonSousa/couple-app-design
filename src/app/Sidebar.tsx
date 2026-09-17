import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { Avatar } from '../design-system/components/Avatar';

const NAV_ITEMS = [
  { to: '/', label: 'Painel', end: true },
  { to: '/lancar-gasto', label: 'Lançar gasto', end: false },
  { to: '/historico', label: 'Histórico', end: false },
  { to: '/saldo', label: 'Saldo', end: false },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className={styles.sidebar} aria-label="Navegação principal">
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          ND
        </span>
        <span className={styles.brandName}>Nós Dois</span>
      </div>

      <ul className={styles.navList}>
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <div className={styles.avatarStack}>
          <Avatar initial="N" name="Nilton" tone="a" />
          <Avatar initial="D" name="Damaris" tone="b" />
        </div>
        <span className={styles.footerText}>Nilton & Damaris</span>
      </div>
    </nav>
  );
}
