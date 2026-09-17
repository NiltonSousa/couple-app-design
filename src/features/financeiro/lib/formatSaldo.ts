import { formatCurrency } from '../../../shared/lib/currency';
import type { Saldo } from './saldo';

const NAME: Record<'nilton' | 'damaris', string> = { nilton: 'Nilton', damaris: 'Damaris' };

export function formatSaldoLabel(saldo: Saldo): string {
  if (!saldo.quemDeve || !saldo.quemRecebe || saldo.valor === 0) {
    return 'Contas quitadas';
  }
  return `${NAME[saldo.quemDeve]} deve ${formatCurrency(saldo.valor)}`;
}

export function saldoTone(saldo: Saldo): 'neutral' | 'danger' {
  return !saldo.quemDeve || saldo.valor === 0 ? 'neutral' : 'danger';
}
