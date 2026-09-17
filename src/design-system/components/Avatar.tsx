import styles from './Avatar.module.css';

type AvatarTone = 'a' | 'b';

interface AvatarProps {
  initial: string;
  name: string;
  tone: AvatarTone;
}

export function Avatar({ initial, name, tone }: AvatarProps) {
  return (
    <span className={`${styles.avatar} ${styles[tone]}`} title={name}>
      {initial}
    </span>
  );
}
