import { useState, type KeyboardEvent } from 'react';
import { Button } from '../../../design-system/components/Button';
import { centsFromDigits, centsToReais, formatCurrency, removeLastDigit } from '../../../shared/lib/currency';
import type { BalanceItem } from '../lib/types';
import styles from './PartialPayControl.module.css';

interface PartialPayControlProps {
  item: BalanceItem;
  onPagarParcela: () => Promise<void>;
  onPagarParte: (valor: number) => Promise<void>;
}

/**
 * Row-level control for registering a paydown that isn't a full quitação.
 * Installment expenses get a single "Pagar parcela" button, since the amount
 * is fixed by the expense; free-form expenses open an inline amount field.
 */
export function PartialPayControl({ item, onPagarParcela, onPagarParte }: PartialPayControlProps) {
  const [open, setOpen] = useState(false);
  const [valorCentavos, setValorCentavos] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (item.isInstallment) {
    const restantes =
      item.totalInstallments !== null && item.paidInstallments !== null
        ? item.totalInstallments - item.paidInstallments
        : null;

    return (
      <Button
        variant="secondary"
        disabled={submitting}
        onClick={async () => {
          setSubmitting(true);
          try {
            await onPagarParcela();
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {restantes !== null ? `Pagar parcela (${restantes} rest.)` : 'Pagar parcela'}
      </Button>
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Pagar parte
      </Button>
    );
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      setValorCentavos((cents) => centsFromDigits(cents, e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setValorCentavos(removeLastDigit);
    } else if (!['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', 'Escape'].includes(e.key) && !(e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  }

  async function handleConfirm() {
    const valor = centsToReais(valorCentavos);
    if (!(valor > 0)) return;
    setSubmitting(true);
    try {
      await onPagarParte(valor);
      setOpen(false);
      setValorCentavos(0);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.inlineForm}>
      <input
        className={styles.amountInput}
        inputMode="numeric"
        placeholder="R$ 0,00"
        value={valorCentavos === 0 ? '' : formatCurrency(centsToReais(valorCentavos))}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Button variant="primary" disabled={submitting || valorCentavos === 0} onClick={handleConfirm}>
        Confirmar
      </Button>
      <Button
        variant="ghost"
        disabled={submitting}
        onClick={() => {
          setOpen(false);
          setValorCentavos(0);
        }}
      >
        Cancelar
      </Button>
    </div>
  );
}
