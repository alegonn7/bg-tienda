import type { Product } from '@/lib/products'
import type { Store } from '@/lib/tenant'
import { categoryLabel } from '@/lib/products'
import { freeShippingFrom } from '@/lib/store-info'
import { gtinOrNull } from '@/lib/gtin'
import { absoluteUrl, storeDisplayName } from '@/lib/seo'
import { SITE_URL } from '@/lib/site-config'

// ---------------------------------------------------------------------------
// Feed de productos para Google Merchant Center (RSS 2.0 con el espacio de nombres g:).
// Especificación: https://support.google.com/merchants/answer/7052112
//
// Qué entra: lo que ya muestra la tienda (store_catalog: tienda habilitada, producto visible y con
// stock), menos lo que Google rechaza sí o sí: productos sin foto o sin precio, y todo el catálogo
// si la tienda oculta los precios (marcar un precio que el visitante no ve va contra sus reglas).
// ---------------------------------------------------------------------------

const TITLE_MAX = 150
const DESCRIPTION_MAX = 5000
const EXTRA_IMAGES_MAX = 10

export type FeedSkip = { id: string; name: string; reason: 'sin foto' | 'sin precio' }

export function feedItems(store: Store, products: Product[]) {
  const included: Product[] = []
  const skipped: FeedSkip[] = []
  for (const p of products) {
    if (!store.showPrices || p.price == null || p.price <= 0) skipped.push({ id: p.id, name: p.name, reason: 'sin precio' })
    else if (p.images.length === 0) skipped.push({ id: p.id, name: p.name, reason: 'sin foto' })
    else included.push(p)
  }
  return { included, skipped }
}

// XML 1.0 no admite caracteres de control (salvo tab y saltos de línea): un solo carácter así en
// una descripción pegada de otro lado invalida el feed entero.
function xml(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`
}

function money(value: number): string {
  return `${value.toFixed(2)} ARS`
}

function tag(name: string, value: string | null | undefined): string {
  return value ? `<g:${name}>${xml(value)}</g:${name}>` : ''
}

// Sin descripción cargada Google rechaza el producto: se arma una con nombre, marca y categoría.
function description(p: Product, storeName: string): string {
  const own = p.description?.replace(/\s+\n/g, '\n').trim()
  if (own) return truncate(own, DESCRIPTION_MAX)
  const sentences = [
    p.name.replace(/[.\s]+$/, ''),
    p.brand?.trim() ? `Marca ${p.brand.trim()}` : '',
    p.category ? categoryLabel(p.category) : '',
    `Comprá online en ${storeName}`,
  ]
  return sentences.filter(Boolean).join('. ') + '.'
}

// Envío, solo cuando es un dato seguro (mismo criterio que el JSON-LD de la página de producto):
// gratis si el producto ya supera el monto de envío gratis. El resto (cotización por código postal
// o tarifas por provincia) se configura una vez en Merchant Center, en "Envíos y devoluciones".
function shipping(store: Store, price: number): string {
  const freeFrom = freeShippingFrom(store)
  if (freeFrom != null && price >= freeFrom) {
    return `<g:shipping><g:country>AR</g:country><g:price>${money(0)}</g:price></g:shipping>`
  }
  return ''
}

function item(p: Product, store: Store, storeName: string): string {
  const price = p.price as number
  const onSale = p.compareAtPrice != null && p.compareAtPrice > price
  const gtin = gtinOrNull(p.barcode)
  const [main, ...extra] = p.images.map(absoluteUrl)

  return [
    '<item>',
    tag('id', p.id),
    tag('title', truncate(p.name.replace(/\s+/g, ' ').trim(), TITLE_MAX)),
    tag('description', description(p, storeName)),
    tag('link', `${SITE_URL}/${store.slug}/productos/${p.id}`),
    tag('image_link', main),
    ...extra.slice(0, EXTRA_IMAGES_MAX).map((url) => tag('additional_image_link', url)),
    // store_catalog solo trae productos con stock: lo agotado sale del feed y Google lo baja solo.
    tag('availability', p.stock == null || p.stock > 0 ? 'in_stock' : 'out_of_stock'),
    // Con precio "antes": price = precio de lista, sale_price = el que se cobra.
    tag('price', money(onSale ? (p.compareAtPrice as number) : price)),
    onSale ? tag('sale_price', money(price)) : '',
    tag('condition', 'new'),
    tag('brand', p.brand?.trim() || null),
    gtin ? tag('gtin', gtin) : tag('identifier_exists', 'no'),
    tag('product_type', p.category ? categoryLabel(p.category) : null),
    shipping(store, price),
    '</item>',
  ]
    .filter(Boolean)
    .join('')
}

export function merchantFeedXml(store: Store, products: Product[]): string {
  const storeName = storeDisplayName(store)
  const { included } = feedItems(store, products)
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    `<title>${xml(storeName)}</title>`,
    `<link>${xml(`${SITE_URL}/${store.slug}`)}</link>`,
    `<description>${xml(`Productos de ${storeName}`)}</description>`,
    ...included.map((p) => item(p, store, storeName)),
    '</channel>',
    '</rss>',
    '',
  ].join('\n')
}
