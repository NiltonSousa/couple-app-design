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
 * Signed running total: positive = Damaris owes Nilton, negative = Nilton
 * owes Damaris. Each eligible pending item adds its counted amount to the
 * payer's side (since the payer is owed) and away from the other person.
 */
export function computeSaldo(gastos: Gasto[]): Saldo {
  let saldoNilton = 0; // positive = Nilton is owed; negative = Nilton owes

  for (const gasto of gastos) {
    if (gasto.status !== 'pendente') continue;

    let valorContado: number;
    if (gasto.divisao === '50-50') {
      valorContado = gasto.valorTotal / 2;
    } else if (gasto.divisao === 'emprestimo' && gasto.abaterNoSaldo) {
      valorContado = gasto.valorTotal;
    } else {
      continue;
    }

    saldoNilton += gasto.pagoPor === 'nilton' ? valorContado : -valorContado;
  }

  if (saldoNilton === 0) {
    return { quemDeve: null, quemRecebe: null, valor: 0 };
  }

  return saldoNilton > 0
    ? { quemDeve: 'damaris', quemRecebe: 'nilton', valor: saldoNilton }
    : { quemDeve: 'nilton', quemRecebe: 'damaris', valor: -saldoNilton };
}
