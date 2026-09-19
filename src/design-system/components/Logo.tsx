import logoSrc from '../../shared/assets/logo.png';
import styles from './Logo.module.css';

interface LogoProps {
  height?: number;
}

export function Logo({ height = 32 }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt="Nós Dois"
      className={styles.logo}
      style={{ height }}
    />
  );
}
