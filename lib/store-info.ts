import type { Store } from '@/lib/tenant'
import { formatPrice } from '@/lib/format'

// Textos que la tienda muestra según lo que tiene activado (envíos, medios de pago, WhatsApp).
// Se derivan de la configuración real para no prometer nada que la tienda no ofrece.

export function storeName(store: Store): string {
  return store.storeName ?? store.organizationName
}

export function whatsappUrl(store: Store, message?: string): string | null {
  if (!store.whatsappNumber) return null
  const text = message ?? store.whatsappMessageTemplate ?? `Hola ${storeName(store)}! Tengo una consulta.`
  return `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(text)}`
}

// Mercado Pago solo cobra si la tienda muestra precios (sin precio no hay total que cobrar).
export function canPayOnline(store: Store): boolean {
  return store.showPrices && (store.mercadopagoAvailable || store.transferEnabled)
}

export function paymentLabels(store: Store): string[] {
  const out: string[] = []
  if (store.showPrices && store.mercadopagoAvailable) out.push('Mercado Pago')
  if (store.showPrices && store.transferEnabled) out.push('Transferencia')
  if (store.whatsappOrdersEnabled && store.whatsappNumber) out.push('Pedido por WhatsApp')
  return out
}

// Monto desde el que el envío es gratis, solo si la tienda envía y muestra precios.
export function freeShippingFrom(store: Store): number | null {
  if (!store.shippingEnabled || !store.showPrices) return null
  return store.freeShippingThreshold != null && store.freeShippingThreshold > 0 ? store.freeShippingThreshold : null
}

// "Av. Corrientes 1234 · Lun a vie de 10 a 19 h", o null si la tienda no cargó nada.
export function pickupText(store: Store): string | null {
  const parts = [store.pickupAddress, store.pickupHours].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

export type Benefit = { icon: 'truck' | 'store' | 'shield' | 'chat' | 'card'; title: string; text: string }

export function storeBenefits(store: Store): Benefit[] {
  const out: Benefit[] = []
  const free = freeShippingFrom(store)
  if (store.shippingEnabled)
    out.push({
      icon: 'truck',
      title: free ? `Envío gratis desde ${formatPrice(free)}` : 'Envíos a todo el país',
      text: 'Calculá el costo con tu código postal',
    })
  out.push({ icon: 'store', title: 'Retiro sin cargo', text: store.pickupAddress ?? 'Pasás a buscar tu pedido por el local' })
  if (store.showPrices && store.mercadopagoAvailable) out.push({ icon: 'shield', title: 'Compra segura', text: 'Pagás con Mercado Pago' })
  else if (store.showPrices && store.transferEnabled) out.push({ icon: 'card', title: 'Pago por transferencia', text: 'Te mostramos el alias al confirmar' })
  if (store.whatsappNumber) out.push({ icon: 'chat', title: 'Te ayudamos', text: 'Respondemos por WhatsApp' })
  return out
}

// Línea de anuncios arriba de todo. En el celular se ve solo la primera.
export function announcements(store: Store): Benefit[] {
  const out: Benefit[] = []
  const free = freeShippingFrom(store)
  if (free) out.push({ icon: 'truck', title: `Envío gratis desde ${formatPrice(free)}`, text: '' })
  else if (store.shippingEnabled) out.push({ icon: 'truck', title: 'Envíos a todo el país', text: '' })
  out.push({ icon: 'store', title: 'Retiro sin cargo en el local', text: '' })
  const pays = paymentLabels(store).filter((p) => p !== 'Pedido por WhatsApp')
  if (pays.length) out.push({ icon: 'card', title: `Pagá con ${pays.join(' o ').replace('Transferencia', 'transferencia')}`, text: '' })
  return out
}
