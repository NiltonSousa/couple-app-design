import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, UnauthorizedError } from '../../../shared/lib/apiClient';
import { addGasto, loadGastos, quitarGasto, reabrirGasto } from '../data/gastosRepository';
import type { Expense, NewExpense } from '../lib/types';

/**
 * 'empty' is distinct from 'ready': the API answered fine and the couple has
 * no expenses yet, which is a first-run state rather than a failure.
 */
type Status = 'loading' | 'error' | 'empty' | 'ready';

interface UseGastosResult {
  status: Status;
  gastos: Expense[];
  /** Load failure — accompanies status 'error'. */
  error: string | null;
  /**
   * Failure of a quitar/reabrir action. Kept apart from `error` so a failed
   * action does not replace the list the user is looking at.
   */
  acaoError: string | null;
  criarGasto: (novo: NewExpense) => Promise<void>;
  quitar: (id: string) => Promise<void>;
  reabrir: (id: string) => Promise<void>;
  recarregar: () => void;
}

function mensagemDe(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

export function useGastos(): UseGastosResult {
  const [status, setStatus] = useState<Status>('loading');
  const [gastos, setGastos] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [acaoError, setAcaoError] = useState<string | null>(null);

  // Guards against a refetch that resolves after the component unmounted, and
  // against an in-flight initial load racing a post-mutation refetch.
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);
    setAcaoError(null);

    try {
      const data = await loadGastos(undefined, controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return;
      setGastos(data);
      setStatus(data.length === 0 ? 'empty' : 'ready');
    } catch (cause) {
      if (!mountedRef.current || controller.signal.aborted) return;
      // A 401 already told the auth provider to drop the session; RequireAuth
      // will redirect to the login screen, so there is no error to show here.
      if (cause instanceof UnauthorizedError) return;
      setError(mensagemDe(cause, 'Não foi possível carregar os gastos.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Mutations refetch the full list instead of patching local state: the
  // server owns derived fields (status, installments) and the lists are small, so
  // a round trip is cheaper than keeping two sources of truth in sync. This
  // matches the behaviour the localStorage version already had.
  const criarGasto = useCallback(
    async (novo: NewExpense) => {
      await addGasto(novo);
      await refresh();
    },
    [refresh],
  );

  const quitar = useCallback(
    async (id: string) => {
      try {
        await quitarGasto(id);
      } catch (cause) {
        if (cause instanceof UnauthorizedError) return;
        if (mountedRef.current) setAcaoError(mensagemDe(cause, 'Não foi possível quitar o gasto.'));
        return;
      }
      await refresh();
    },
    [refresh],
  );

  const reabrir = useCallback(
    async (id: string) => {
      try {
        await reabrirGasto(id);
      } catch (cause) {
        if (cause instanceof UnauthorizedError) return;
        if (mountedRef.current) setAcaoError(mensagemDe(cause, 'Não foi possível reabrir o gasto.'));
        return;
      }
      await refresh();
    },
    [refresh],
  );

  return { status, gastos, error, acaoError, criarGasto, quitar, reabrir, recarregar: refresh };
}
