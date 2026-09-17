import { formatCurrency } from '../../../shared/lib/currency';
import type { Gasto } from './types';

export interface SaldoItem {
  gastoId: string;
  descricao: string;
  valorFormatado: string;
}

/**
 * Pending items that compose the aggregate balance: 50/50 pending (half the
 * value) and emprestimo pending with abaterNoSaldo (full value). Mirrors the
 * eligibility rule in computeSaldo — kept as a separate, list-shaped view
 * since the "Detalhe do saldo" screen needs per-item rows, not just a total.
 */
export function saldoItems(gastos: Gasto[]): SaldoItem[] {
  return gastos
    .filter((g) => g.status === 'pendente')
    .filter((g) => g.divisao === '50-50' || (g.divisao === 'emprestimo' && g.abaterNoSaldo))
    .map((g) => {
      const valor = g.divisao === '50-50' ? g.valorTotal / 2 : g.valorTotal;
      const sufixo = g.divisao === '50-50' ? ' (metade)' : '';
      return {
        gastoId: g.id,
        descricao: `${g.descricao}${sufixo}`,
        valorFormatado: formatCurrency(valor),
      };
    });
}
