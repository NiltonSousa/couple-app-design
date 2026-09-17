import { useCallback, useState } from 'react';
import { ApiError, UnauthorizedError } from '../../../shared/lib/apiClient';
import { pagarParcela, pagarParte, quitarGasto } from '../data/gastosRepository';

interface UseSettleExpenseResult {
  acaoError: string | null;
  quitar: (id: string) => Promise<void>;
  pagarParcela: (id: string) => Promise<void>;
  pagarParte: (id: string, valor: number) => Promise<void>;
}

/**
 * The paydown mutations (quitar, pagar parcela, pagar parte), with no expense
 * list attached. Screens that only need to act on an item (e.g. Detalhe do
 * saldo, which reads its items from `useSaldo`) would otherwise have to mount
 * `useGastos` for its side effect of firing an unused `GET /expenses`.
 */
export function useSettleExpense(): UseSettleExpenseResult {
  const [acaoError, setAcaoError] = useState<string | null>(null);

  const runAction = useCallback(async (action: () => Promise<void>, fallbackMessage: string) => {
    setAcaoError(null);
    try {
      await action();
    } catch (cause) {
      if (cause instanceof UnauthorizedError) return;
      setAcaoError(cause instanceof ApiError ? cause.message : fallbackMessage);
    }
  }, []);

  const quitar = useCallback(
    (id: string) => runAction(() => quitarGasto(id), 'Não foi possível quitar o gasto.'),
    [runAction],
  );

  const pagarParcelaAction = useCallback(
    (id: string) => runAction(() => pagarParcela(id), 'Não foi possível registrar o pagamento da parcela.'),
    [runAction],
  );

  const pagarParteAction = useCallback(
    (id: string, valor: number) => runAction(() => pagarParte(id, valor), 'Não foi possível registrar o pagamento.'),
    [runAction],
  );

  return { acaoError, quitar, pagarParcela: pagarParcelaAction, pagarParte: pagarParteAction };
}
