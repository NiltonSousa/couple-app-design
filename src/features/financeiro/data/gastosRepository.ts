import type { Gasto, NovoGasto } from '../lib/types';

/**
 * Client-only persistence for v1 (per spec: no backend yet).
 * Function signatures intentionally match backend-tasks.md Fase 6 so a future
 * swap to `fetch` calls doesn't require touching call sites.
 */
const STORAGE_KEY = 'nosDois.gastos.v1';

function readAll(): Gasto[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Gasto[];
  } catch {
    return [];
  }
}

function writeAll(gastos: Gasto[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gastos));
}

export async function loadGastos(): Promise<Gasto[]> {
  return readAll();
}

export async function addGasto(novo: NovoGasto): Promise<Gasto> {
  const gasto: Gasto = {
    ...novo,
    id: crypto.randomUUID(),
    status: 'pendente',
  };
  const gastos = readAll();
  gastos.push(gasto);
  writeAll(gastos);
  return gasto;
}

export async function quitarGasto(id: string): Promise<void> {
  const gastos = readAll();
  const gasto = gastos.find((g) => g.id === id);
  if (gasto) gasto.status = 'quitado';
  writeAll(gastos);
}

export async function reabrirGasto(id: string): Promise<void> {
  const gastos = readAll();
  const gasto = gastos.find((g) => g.id === id);
  if (gasto) gasto.status = 'pendente';
  writeAll(gastos);
}
