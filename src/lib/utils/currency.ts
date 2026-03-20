const formatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

export function formatPrice(amount: number): string {
  return formatter.format(amount)
}
