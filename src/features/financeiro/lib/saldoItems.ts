import { formatCurrency } from '../../../shared/lib/currency';
import type { BalanceItem } from './types';

/**
 * Row label for the Pendências screen. UI text, hence Portuguese.
 *
 * The items themselves come from `GET /api/v1/summary`; only their labelling
 * lives on the client.
 */
export function formatBalanceItemLabel(item: BalanceItem): string {
  return item.half ? `${item.description} (metade)` : item.description;
}

/**
 * Value of one installment for an isInstallment item, so the user sees
 * exactly how much "Pagar parcela" will debit before clicking it. Null for a
 * non-installment item, since there's no fixed per-click amount to show.
 */
export function formatInstallmentAmountLabel(item: BalanceItem): string | null {
  if (!item.isInstallment || item.installmentAmount === null) return null;
  const pagas = item.paidInstallments ?? 0;
  return `${formatCurrency(item.installmentAmount)} por parcela (${pagas}/${item.totalInstallments ?? '?'})`;
}
