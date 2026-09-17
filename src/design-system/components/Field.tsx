import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

function FieldWrapper({ label, htmlFor, children }: FieldWrapperProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export function InputField({ label, id, className, ...rest }: InputFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id}>
      <input id={id} className={[styles.control, className].filter(Boolean).join(' ')} {...rest} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
}

export function SelectField({ label, id, className, children, ...rest }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id}>
      <select id={id} className={[styles.control, className].filter(Boolean).join(' ')} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
}

export function TextareaField({ label, id, className, ...rest }: TextareaFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id}>
      <textarea
        id={id}
        className={[styles.control, styles.textarea, className].filter(Boolean).join(' ')}
        {...rest}
      />
    </FieldWrapper>
  );
}
