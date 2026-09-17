/**
 * Shapes of the expense contract (`internal/httpapi/expense_dto.go`).
 *
 * Field and enum names here are the wire contract, which is in English; the
 * UI's own vocabulary stays in Portuguese (labels, route names, component
 * names). The two are kept apart on purpose: a label change must never be a
 * contract change, and vice-versa.
 */

/**
 * Slug of a couple member, as issued by the backend (derived there from the
 * user's name). It is a plain `string` because the authoritative values come
 * from `GET /auth/me` at runtime — the frontend must not assume which slugs
 * exist. Use `KnownPerson` when you want autocomplete over the two seeded
 * names; never use it to type API data.
 */
export type Person = string;

/** The slugs this couple has today. Kept for autocomplete/readability only. */
export type KnownPerson = 'nilton' | 'damaris';

export type Category = 'travel' | 'gift' | 'food' | 'transport' | 'others';

export type Split = '50-50' | 'individual' | 'loan';

export type ExpenseStatus = 'pending' | 'settled';

export interface Expense {
  id: string;
  description: string;
  category: Category;
  date: string; // ISO 8601 (yyyy-mm-dd)
  totalAmount: number;
  paidBy: Person;
  split: Split;
  /** Only meaningful when split === 'loan'. */
  countsTowardBalance: boolean | null;
  status: ExpenseStatus;
  isInstallment: boolean;
  totalInstallments: number | null;
  paidInstallments: number | null;
  installmentAmount: number | null;
  observation: string;
}

export type NewExpense = Omit<Expense, 'id' | 'status'>;

/**
 * Aggregate balance between the two members, as computed by the server
 * (`balanceDTO` in `internal/httpapi/expense_handler.go`).
 *
 * This is NOT recomputed on the client. The server works in int64 cents and
 * rounds an odd 50/50 split toward the creditor; a float division here would
 * disagree with it (R$19,99 → R$9,995 on the client vs R$10,00 on the server),
 * so the balance has exactly one source of truth.
 */
export interface Balance {
  /** Slug of the member who owes, or null when the balance is zero. */
  debtor: Person | null;
  /** Slug of the member who is owed, or null when the balance is zero. */
  creditor: Person | null;
  /** Absolute amount owed, in reais. Zero when settled. */
  amount: number;
}

/**
 * One pending expense's contribution to the balance (`balanceItemDTO`).
 * `half` says whether `amount` is half of the expense total (a 50/50 split)
 * rather than the whole of it; the "(metade)" wording is presentation and is
 * built by `formatBalanceItemLabel`, not carried on the wire.
 */
export interface BalanceItem {
  expenseId: string;
  description: string;
  amount: number;
  half: boolean;
}

export interface CategoryTotal {
  category: Category;
  total: number;
}

/** Response of `GET /api/v1/summary` (`summaryResponse`). */
export interface Summary {
  balance: Balance;
  balanceItems: BalanceItem[];
  grandTotal: number;
  pendingCount: number;
  byCategory: CategoryTotal[] | null;
}

/** Wire sentinel for "no filter on this field" (`httpapi.filterAll`). */
export const FILTER_ALL = 'all' as const;

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'travel', label: 'Viagem' },
  { value: 'gift', label: 'Presente' },
  { value: 'food', label: 'Alimentação' },
  { value: 'transport', label: 'Transporte' },
  { value: 'others', label: 'Outros' },
];

/**
 * The couple's members are NOT a constant — they come from the session
 * (`useCasal`), because the backend derives each slug from the user's name.
 */

export const SPLITS: { value: Split; label: string }[] = [
  { value: '50-50', label: 'Dividir 50/50' },
  { value: 'individual', label: 'Individual' },
  { value: 'loan', label: 'Empréstimo' },
];
