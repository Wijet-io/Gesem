export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export function calculatePay(hours: number, rate: number): number {
  return Math.round(hours * rate * 100) / 100;
}