import { apiRequest } from '../../../shared/lib/apiClient';
import type { Expense, NewExpense, Summary } from '../lib/types';

/**
 * Expense persistence, backed by the Nós Dois API.
 *
 * The wire format matches `Expense`/`NewExpense` field for field — both mirror
 * the backend DTOs in `internal/httpapi/expense_dto.go` — so there is no
 * mapping layer here on purpose. In particular `totalAmount` and
 * `installmentAmount` travel as reais (e.g. 19.99); the cents conversion is
 * internal to the server.
 */

/** Optional server-side filters, mirroring the query params on GET /expenses. */
export interface ExpensesFilter {
  category?: string;
  paidBy?: string;
  status?: string;
  /** YYYY-MM-DD */
  from?: string;
  /** YYYY-MM-DD */
  to?: string;
}

export async function loadGastos(filter?: ExpensesFilter, signal?: AbortSignal): Promise<Expense[]> {
  return apiRequest<Expense[]>('/api/v1/expenses', { query: { ...filter }, signal });
}

/**
 * Server-computed summary: the aggregate balance, the items composing it, and
 * the totals. The balance is deliberately not derived from `loadGastos` on the
 * client — see the note on `Summary` in `../lib/types`.
 */
export async function loadSummary(signal?: AbortSignal): Promise<Summary> {
  return apiRequest<Summary>('/api/v1/summary', { signal });
}

export async function addGasto(novo: NewExpense): Promise<Expense> {
  return apiRequest<Expense>('/api/v1/expenses', { method: 'POST', body: novo });
}

/**
 * Both transitions answer 200 with the updated expense. The return type stays
 * `void` because `useGastos` refetches the whole list after a mutation rather
 * than patching a single row — keeping the response unused makes that
 * explicit at the call site.
 */
export async function quitarGasto(id: string): Promise<void> {
  await apiRequest<Expense>(`/api/v1/expenses/${encodeURIComponent(id)}/settle`, { method: 'POST' });
}

export async function reabrirGasto(id: string): Promise<void> {
  await apiRequest<Expense>(`/api/v1/expenses/${encodeURIComponent(id)}/reopen`, { method: 'POST' });
}

/** Records one more paid installment on an isInstallment expense. */
export async function pagarParcela(id: string): Promise<void> {
  await apiRequest<Expense>(`/api/v1/expenses/${encodeURIComponent(id)}/pay-installment`, { method: 'POST' });
}

/** Records a free-form partial payment (reais) on a non-installment expense. */
export async function pagarParte(id: string, valor: number): Promise<void> {
  await apiRequest<Expense>(`/api/v1/expenses/${encodeURIComponent(id)}/pay-partial`, {
    method: 'POST',
    body: { amount: valor },
  });
}
