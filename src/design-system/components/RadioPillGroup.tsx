import styles from './RadioPillGroup.module.css';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface RadioPillGroupProps<T extends string> {
  legend: string;
  name: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function RadioPillGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: RadioPillGroupProps<T>) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label key={option.value} className={`${styles.pill} ${selected ? styles.selected : ''}`}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className={styles.input}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
