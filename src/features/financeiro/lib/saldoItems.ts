import type { BalanceItem } from './types';

/**
 * Row label for the "Detalhe do saldo" screen. UI text, hence Portuguese.
 *
 * The items themselves come from `GET /api/v1/summary`; only their labelling
 * lives on the client.
 */
export function formatBalanceItemLabel(item: BalanceItem): string {
  return item.half ? `${item.description} (metade)` : item.description;
}
