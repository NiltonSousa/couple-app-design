import { formatCurrency } from '../../../shared/lib/currency';
import type { Balance, Person } from './types';

/**
 * `labelDe` maps a member slug to a display name and comes from the session
 * (`useCasal().labelDe`) — names are not hardcoded here, since the backend
 * owns both the slug and the name.
 */
export function formatSaldoLabel(balance: Balance, labelDe: (slug: Person) => string): string {
  if (!balance.debtor || !balance.creditor || balance.amount === 0) {
    return 'Contas quitadas';
  }
  return `${labelDe(balance.debtor)} deve ${formatCurrency(balance.amount)}`;
}

export function saldoTone(balance: Balance): 'neutral' | 'danger' {
  return !balance.debtor || balance.amount === 0 ? 'neutral' : 'danger';
}
