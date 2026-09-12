'use server'

import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/components/cart-context'
import { invokeMercadoPagoFunction } from '@/lib/mercadopago'

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

// Pedido con pago online. A diferencia de createPendingOrder, acá sí importa el precio: el
// comprador va a pagar ese monto de verdad. Por eso recibe solo productId/size/quantity (nunca
// un precio) y lo resuelve server-side contra store_catalog — el mismo dato que ya usa el
// storefront para mostrarlo, nunca lo que mandó el navegador. Tampoco falla en silencio: no hay
// canal de respaldo tipo WhatsApp si esto no funciona.
export async function createMercadoPagoCheckout(
  organizationId: string,
  branchId: string,
  slug: string,
  items: { productId: string; size?: string; quantity: number }[],
): Promise<{ checkoutUrl: string }> {
  if (items.length === 0) throw new Error('El carrito está vacío.')

  const supabase = await createClient()

  const productIds = [...new Set(items.map((i) => i.productId))]
  const { data: catalogRows, error: catalogError } = await supabase
    .from('store_catalog')
    .select('product_id, name, price_sale')
    .eq('branch_id', branchId)
    .in('product_id', productIds)

  if (catalogError) throw new Error(catalogError.message)

  const priceByProduct = new Map((catalogRows ?? []).map((row) => [row.product_id, row]))

  const orderItems = items.map((item) => {
    const row = priceByProduct.get(item.productId)
    if (!row || row.price_sale == null) {
      throw new Error(`"${row?.name ?? 'Un producto'}" ya no está disponible para pagar online.`)
    }
    return {
      product_id: item.productId,
      product_name: row.name as string,
      size: item.size || null,
      quantity: item.quantity,
      unit_price: row.price_sale as number,
      subtotal: (row.price_sale as number) * item.quantity,
    }
  })

  const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0)

  const { data: order, error: orderError } = await supabase
    .from('store_orders')
    .insert({
      organization_id: organizationId,
      branch_id: branchId,
      status: 'pending',
      payment_method: 'mercadopago',
      subtotal,
      total: subtotal, // mercadopago-checkout fija el total final (+ comisión)
    })
    .select('id')
    .single()

  if (orderError) throw new Error('No se pudo crear el pedido. Intentá de nuevo.')

  const { error: itemsError } = await supabase
    .from('store_order_items')
    .insert(orderItems.map((item) => ({ ...item, store_order_id: order.id })))

  if (itemsError) throw new Error('No se pudo crear el pedido. Intentá de nuevo.')

  return invokeMercadoPagoFunction<{ checkoutUrl: string }>(supabase, 'mercadopago-checkout', {
    storeOrderId: order.id,
    slug,
  })
}
