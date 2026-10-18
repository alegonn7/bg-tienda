import type { SupabaseClient } from '@supabase/supabase-js'

// Estado de un pedido de la tienda tal como lo ve el dueño en el panel. La tabla solo guarda
// pending / confirmed / cancelled / refunded; acá se traduce a lo que tiene que hacer con él
// (confirmar una transferencia, despachar, revisar stock...).

export type OrderLike = {
  status: string
  payment_method: string
  mp_status: string | null
  delivery_method: string | null
  tracking_code: string | null
}

export type OrderState = {
  label: string
  tone: 'ok' | 'warn' | 'bad' | 'info' | 'gray'
  // true si el dueño tiene que hacer algo (va a "Por atender" y suma al contador del menú).
  attention: boolean
}

export function orderState(o: OrderLike): OrderState {
  const shipping = o.delivery_method === 'shipping'
  if (o.status === 'pending') {
    if (o.payment_method === 'mercadopago') {
      return o.mp_status === 'approved'
        ? { label: 'Pagado, revisar stock', tone: 'bad', attention: true }
        : { label: 'Esperando pago', tone: 'gray', attention: false }
    }
    return { label: 'A confirmar', tone: 'warn', attention: true }
  }
  if (o.status === 'confirmed') {
    if (shipping && !o.tracking_code) return { label: 'Para despachar', tone: 'info', attention: true }
    if (shipping) return { label: 'Enviado', tone: 'ok', attention: false }
    return { label: 'Confirmado', tone: 'ok', attention: false }
  }
  if (o.status === 'refunded') return { label: 'Reembolsado', tone: 'gray', attention: false }
  if (o.status === 'cancelled') return { label: 'Cancelado', tone: 'gray', attention: false }
  return { label: o.status, tone: 'gray', attention: false }
}

export const PAYMENT_LABEL: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  transfer: 'Transferencia',
  whatsapp: 'WhatsApp',
}

// Cantidad de pedidos que esperan algo del dueño, para el número del menú. Dos counts en vez de
// traer filas: transferencias/WhatsApp sin confirmar + pagos aprobados trabados, y envíos pagados
// sin código de seguimiento.
export async function countOrdersNeedingAttention(supabase: SupabaseClient): Promise<number> {
  const [pending, toShip] = await Promise.all([
    supabase
      .from('store_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .or('payment_method.neq.mercadopago,mp_status.eq.approved'),
    supabase
      .from('store_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .eq('delivery_method', 'shipping')
      .is('tracking_code', null),
  ])
  return (pending.count ?? 0) + (toShip.count ?? 0)
}
