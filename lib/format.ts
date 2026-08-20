// Mismo formato que usa bg-gestion (Intl.NumberFormat es-AR) para que los precios se vean
// iguales en los dos sistemas — bg-gestion hoy los muestra de varias formas distintas según la
// pantalla (toFixed(2), toLocaleString suelto, Intl.NumberFormat...), esta es la que se adopta acá.
const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
})

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return '—'
  return priceFormatter.format(value)
}
