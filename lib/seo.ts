import type { Store } from '@/lib/tenant'
import { SITE_URL } from '@/lib/site-config'

// Nombre visible de una tienda: el mismo criterio que usan el header y el <title>.
export function storeDisplayName(store: Store): string {
  return store.storeName ?? store.organizationName
}

// Google corta las descripciones cerca de los 155-160 caracteres: se colapsan espacios/saltos de
// línea y se corta en el último espacio antes del límite, para no dejar una palabra partida.
export function metaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:]+$/, '')}…`
}

// Las imágenes de producto suelen ser URLs absolutas de Supabase Storage, pero el fallback
// (/placeholder.jpg) es relativo; JSON-LD y Open Graph necesitan URLs absolutas.
export function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_URL).toString()
}
