import { cloneElement, isValidElement, useState, type ReactElement } from 'react';
import { Sidebar } from './Sidebar';
import styles from './AppShell.module.css';

interface AppShellProps {
  topbar: ReactElement<{ onMenuClick?: () => void }>;
  children: React.ReactNode;
}

export function AppShell({ topbar, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <div className={styles.desktopSidebar}>
        <Sidebar />
      </div>

      {drawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className={styles.main}>
        {isValidElement(topbar) ? cloneElement(topbar, { onMenuClick: () => setDrawerOpen(true) }) : topbar}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
