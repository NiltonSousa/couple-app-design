import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, UnauthorizedError } from '../../../shared/lib/apiClient';
import { loadSummary } from '../data/gastosRepository';
import type { Summary } from '../lib/types';

/**
 * 'empty' is distinct from 'ready': the API answered fine and nothing pending
 * composes the balance yet (contas quitadas), which is a normal state rather
 * than a failure.
 */
type Status = 'loading' | 'error' | 'empty' | 'ready';

interface UseSaldoResult {
  status: Status;
  /** Null until the first successful load. */
  summary: Summary | null;
  /** Load failure — accompanies status 'error'. */
  error: string | null;
  recarregar: () => void;
}

/**
 * Server-computed balance, from `GET /api/v1/summary`.
 *
 * Deliberately separate from `useGastos` rather than folded into it: the
 * expense list screens (Histórico, Lançar gasto) do not need the summary, and
 * coupling the two would make them wait on a request they never read. Screens
 * that need both call both hooks, and the two requests go out in parallel.
 *
 * The mutation (quitar) lives in `useGastos`; a screen that mutates must call
 * `recarregar` here as well, since the balance is derived server-side from the
 * same expenses.
 */
export function useSaldo(): UseSaldoResult {
  const [status, setStatus] = useState<Status>('loading');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Split from `recarregar` on purpose: this sets no state before its first
  // await, so the mount effect below does not start a cascading render. The
  // 'loading'/error reset belongs to the event that asked for a refetch.
  const fetchSummary = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await loadSummary(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return;
      setSummary(data);
      setStatus(data.balanceItems.length === 0 ? 'empty' : 'ready');
    } catch (cause) {
      if (!mountedRef.current || controller.signal.aborted) return;
      // A 401 already told the auth provider to drop the session; RequireAuth
      // will redirect to the login screen, so there is no error to show here.
      if (cause instanceof UnauthorizedError) return;
      setError(
        cause instanceof ApiError ? cause.message : 'Não foi possível carregar o saldo.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    // fetchSummary sets no state before its first await; the rule cannot see
    // past the async boundary. Fetching on mount is exactly the
    // external-system sync the rule exists to allow.
    // eslint-disable-next-line react/set-state-in-effect
    fetchSummary();
  }, [fetchSummary]);

  const recarregar = useCallback(() => {
    setStatus('loading');
    setError(null);
    fetchSummary();
  }, [fetchSummary]);

  return { status, summary, error, recarregar };
}
