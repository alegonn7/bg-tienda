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

// Argentina no tiene horario de verano: UTC-3 fijo. Se usa para agrupar ventas por día/mes del
// lado del servidor (Vercel corre en UTC) sin depender de la zona horaria de la máquina.
const AR_OFFSET_MS = 3 * 60 * 60 * 1000

// Fecha "de Argentina" de un instante, como YYYY-MM-DD.
export function arDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Date(d.getTime() - AR_OFFSET_MS).toISOString().slice(0, 10)
}

// Instante (UTC) en que empieza el día 1 del mes de Argentina que contiene `date`, corrido
// `monthDelta` meses.
export function arMonthStart(date: Date, monthDelta = 0): Date {
  const local = new Date(date.getTime() - AR_OFFSET_MS)
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + monthDelta, 1) + AR_OFFSET_MS)
}

const relativeFormatter = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' })

// "hace 12 minutos", "ayer", "hace 3 días"; más de una semana, la fecha corta.
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = (d.getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'recién'
  if (abs < 3600) return relativeFormatter.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return relativeFormatter.format(Math.round(diff / 3600), 'hour')
  if (abs < 7 * 86400) return relativeFormatter.format(Math.round(diff / 86400), 'day')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })
}
