import { useCallback, useState } from 'react';
import { ApiError, UnauthorizedError } from '../../../shared/lib/apiClient';
import { quitarGasto } from '../data/gastosRepository';

interface UseSettleExpenseResult {
  acaoError: string | null;
  quitar: (id: string) => Promise<void>;
}

/**
 * Just the settle mutation, with no expense list attached. Screens that only
 * need to quitar an item (e.g. Detalhe do saldo, which reads its items from
 * `useSaldo`) would otherwise have to mount `useGastos` for its side effect
 * of firing an unused `GET /expenses`.
 */
export function useSettleExpense(): UseSettleExpenseResult {
  const [acaoError, setAcaoError] = useState<string | null>(null);

  const quitar = useCallback(async (id: string) => {
    setAcaoError(null);
    try {
      await quitarGasto(id);
    } catch (cause) {
      if (cause instanceof UnauthorizedError) return;
      setAcaoError(cause instanceof ApiError ? cause.message : 'Não foi possível quitar o gasto.');
    }
  }, []);

  return { acaoError, quitar };
}
