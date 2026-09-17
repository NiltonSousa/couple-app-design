import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { Avatar } from '../design-system/components/Avatar';
import { useAuth } from '../features/auth/hooks/authContext';

const NAV_ITEMS = [
  { to: '/', label: 'Painel', end: true },
  { to: '/lancar-gasto', label: 'Lançar gasto', end: false },
  { to: '/historico', label: 'Histórico', end: false },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { sessao, sair } = useAuth();
  // Names come from the session, not from a constant — the backend owns them.
  const membros = sessao?.couple.members ?? [];

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
          {membros.map((membro, index) => (
            <Avatar
              key={membro.id}
              initial={membro.name.charAt(0).toUpperCase()}
              name={membro.name}
              tone={index === 0 ? 'a' : 'b'}
            />
          ))}
        </div>
        <span className={styles.footerText}>{membros.map((m) => m.name).join(' & ')}</span>
        <button type="button" className={styles.logout} onClick={sair}>
          Sair
        </button>
      </div>
    </nav>
  );
}
