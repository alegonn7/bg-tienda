'use server'

import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/components/cart-context'

// Crea el pedido "pendiente" antes de abrir WhatsApp — corre con el cliente anon (visitante sin
// sesión). Las policies públicas de INSERT de la Fase 01 (store_orders_public_insert /
// store_order_items_public_insert) son las que autorizan esto, no hace falta service-role acá.
// `pending` no descuenta ni reserva stock — eso recién pasa cuando el staff confirma desde
// /admin/pedidos (Fase 06, confirm_store_order).
export async function createPendingOrder(
  organizationId: string,
  branchId: string,
  items: CartItem[],
): Promise<string | null> {
  if (items.length === 0) return null

  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('store_orders')
    .insert({ organization_id: organizationId, branch_id: branchId, status: 'pending' })
    .select('id')
    .single()

  if (error) {
    console.error('createPendingOrder: no se pudo crear store_orders', error.message)
    return null
  }

  const { error: itemsError } = await supabase.from('store_order_items').insert(
    items.map((item) => ({
      store_order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      size: item.size || null,
      quantity: item.quantity,
    })),
  )

  if (itemsError) {
    console.error('createPendingOrder: no se pudo crear store_order_items', itemsError.message)
    return null
  }

  return order.id
}
