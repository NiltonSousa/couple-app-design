const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  return formatter.format(value);
}

/**
 * Digits accumulate as cents, ATM-style: typing "1999" reads as R$ 19,99.
 * Avoids parsing an ambiguous decimal separator from free text.
 */
export function centsFromDigits(cents: number, keyDigit: string): number {
  return cents * 10 + Number(keyDigit);
}

export function removeLastDigit(cents: number): number {
  return Math.trunc(cents / 10);
}

export function centsToReais(cents: number): number {
  return cents / 100;
}
