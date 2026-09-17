import type { HTMLAttributes } from 'react';
import styles from './Tag.module.css';

export function Tag({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  const classes = [styles.tag, className].filter(Boolean).join(' ');
  return <span className={classes} {...rest} />;
}
