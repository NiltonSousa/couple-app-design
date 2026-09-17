import { useCallback, useEffect, useState } from 'react';
import { addGasto, loadGastos, quitarGasto, reabrirGasto } from '../data/gastosRepository';
import type { Gasto, NovoGasto } from '../lib/types';

type Status = 'loading' | 'error' | 'ready';

interface UseGastosResult {
  status: Status;
  gastos: Gasto[];
  error: string | null;
  criarGasto: (novo: NovoGasto) => Promise<void>;
  quitar: (id: string) => Promise<void>;
  reabrir: (id: string) => Promise<void>;
}

export function useGastos(): UseGastosResult {
  const [status, setStatus] = useState<Status>('loading');
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await loadGastos();
      setGastos(data);
      setStatus('ready');
    } catch {
      setError('Não foi possível carregar os gastos.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const criarGasto = useCallback(async (novo: NovoGasto) => {
    await addGasto(novo);
    await refresh();
  }, [refresh]);

  const quitar = useCallback(async (id: string) => {
    await quitarGasto(id);
    await refresh();
  }, [refresh]);

  const reabrir = useCallback(async (id: string) => {
    await reabrirGasto(id);
    await refresh();
  }, [refresh]);

  return { status, gastos, error, criarGasto, quitar, reabrir };
}
