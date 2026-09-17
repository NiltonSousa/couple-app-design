import type { Gasto, Pessoa } from './types';

export interface Saldo {
  /** Person who owes money, or null if the balance is zero. */
  quemDeve: Pessoa | null;
  /** Person who is owed money, or null if the balance is zero. */
  quemRecebe: Pessoa | null;
  /** Absolute amount owed. Zero when settled. */
  valor: number;
}

/**
 * Aggregate balance between the two people.
 *
 * Rule (docs/superpowers/specs/2026-06-30-nos-dois-financeiro-design.md):
 * - `divisao: '50-50'` pending items: half the value counts toward whoever
 *   DIDN'T pay owing the payer.
 * - `divisao: 'emprestimo'` pending items with `abaterNoSaldo: true`: the
 *   FULL value counts the same way (not half).
 * - `divisao: 'individual'`, and `emprestimo` with `abaterNoSaldo: false`,
 *   never enter this calculation.
 * - Only `status: 'pendente'` items count — settling an item removes it
 *   from the balance immediately.
 *
 * TODO(user): implement the aggregation loop below.
 *
 * Suggested approach: keep a running signed total (e.g. positive = Nilton
 * owes Damaris, negative = Damaris owes Nilton), walk `gastos`, and for each
 * eligible pending item add/subtract the counted amount based on `pagoPor`.
 * At the end, convert the signed total into `{ quemDeve, quemRecebe, valor }`.
 */
export function computeSaldo(gastos: Gasto[]): Saldo {
  // TODO(user): replace this stub with the real aggregation.
  void gastos;
  return { quemDeve: null, quemRecebe: null, valor: 0 };
}
