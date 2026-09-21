'use server'

import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/components/cart-context'
import { invokeMercadoPagoFunction } from '@/lib/mercadopago'
import { invokeShippingFunction } from '@/lib/shipping'

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
type DeliveryAddress = {
  street: string
  number: string
  floorApartment?: string
  city: string
  province: string
  postalCode: string
}

type Delivery = {
  method: 'pickup' | 'shipping'
  // Opcionales: cuando una tienda no activó envíos, el botón de pago sigue funcionando
  // exactamente igual que antes de este feature (sin pedir nombre/teléfono) — ver
  // cart-drawer.tsx, que llama esto directo con solo { method: 'pickup', customerEmail } en ese caso.
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerNote?: string
  address?: DeliveryAddress
}

// Preview de costo de envío antes de pagar -- puramente informativo, no persiste nada. El
// costo real que se cobra se recotiza server-to-server dentro de createMercadoPagoCheckout,
// nunca se confía en este resultado (mismo principio que unit_price: nunca un monto que vino
// del cliente).
export async function quoteShipping(
  organizationId: string,
  destinationPostalCode: string,
  destinationProvince: string,
  items: { productId: string; quantity: number }[],
): Promise<{ cost: number; originalCost: number; isFree: boolean; estimatedDays: number | null; usedDefaultDimensions: boolean }> {
  const supabase = await createClient()
  return invokeShippingFunction(supabase, 'shipping-quote', {
    organizationId,
    destinationPostalCode,
    destinationProvince,
    items,
  })
}

export async function createMercadoPagoCheckout(
  organizationId: string,
  branchId: string,
  slug: string,
  items: { productId: string; size?: string; quantity: number }[],
  delivery: Delivery,
): Promise<{ checkoutUrl: string }> {
  if (items.length === 0) throw new Error('El carrito está vacío.')
  if (delivery.method === 'shipping' && !delivery.address?.postalCode) {
    throw new Error('Falta la dirección de envío.')
  }

  // Todo lo que sigue toca servicios externos (Supabase, shipping-quote, mercadopago-checkout) --
  // a diferencia de las validaciones de arriba, una falla acá no siempre es un Error prolijo
  // (ver createPendingOrder para el mismo patrón). Sin este try/catch, una excepción rara se
  // propaga muda hasta el mensaje genérico de Next.js sin dejar rastro en los logs de Vercel.
  try {
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

    // Recotización autoritativa server-to-server: nunca se confía en el costo que ya se mostró
    // en el navegador durante el preview (quoteShipping).
    let shippingCost = 0
    let shippingOriginalCost: number | null = null
    let shippingCarrier: string | null = null
    if (delivery.method === 'shipping' && delivery.address) {
      const { data: settings } = await supabase
        .from('store_settings')
        .select('shipping_carrier')
        .eq('organization_id', organizationId)
        .single()
      shippingCarrier = settings?.shipping_carrier ?? null

      const result = await invokeShippingFunction<{ cost: number; originalCost: number }>(supabase, 'shipping-quote', {
        organizationId,
        destinationPostalCode: delivery.address.postalCode,
        destinationProvince: delivery.address.province,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      shippingCost = result.cost
      // Solo se guarda cuando hay descuento real -- así el resto del código (pantalla de
      // pedido, admin, emails) puede usar "shipping_original_cost != null" como el único chequeo
      // de "¿este envío se lo bonificamos?", sin tener que comparar números en cada lugar.
      shippingOriginalCost = result.originalCost > result.cost ? result.originalCost : null
    }

    const { data: order, error: orderError } = await supabase
      .from('store_orders')
      .insert({
        organization_id: organizationId,
        branch_id: branchId,
        status: 'pending',
        payment_method: 'mercadopago',
        subtotal,
        total: subtotal, // mercadopago-checkout fija el total final (+ envío; la comisión no la paga el cliente)
        customer_name: delivery.customerName || null,
        customer_phone: delivery.customerPhone || null,
        customer_email: delivery.customerEmail || null,
        customer_note: delivery.customerNote || null,
        delivery_method: delivery.method,
        shipping_carrier: shippingCarrier,
        // A diferencia de "|| null": 0 es un costo de envío legítimo (envío gratis por monto
        // mínimo), no debe perderse como null -- null acá significa "no es un pedido con envío".
        shipping_cost: delivery.method === 'shipping' ? shippingCost : null,
        shipping_original_cost: shippingOriginalCost,
        shipping_street: delivery.address?.street || null,
        shipping_number: delivery.address?.number || null,
        shipping_floor_apartment: delivery.address?.floorApartment || null,
        shipping_city: delivery.address?.city || null,
        shipping_province: delivery.address?.province || null,
        shipping_postal_code: delivery.address?.postalCode || null,
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('createMercadoPagoCheckout: insert store_orders falló', orderError.code, orderError.message, orderError.details, orderError.hint)
      throw new Error('No se pudo crear el pedido. Intentá de nuevo.')
    }

    const { error: itemsError } = await supabase
      .from('store_order_items')
      .insert(orderItems.map((item) => ({ ...item, store_order_id: order.id })))

    if (itemsError) {
      console.error('createMercadoPagoCheckout: insert store_order_items falló', itemsError.code, itemsError.message, itemsError.details, itemsError.hint)
      throw new Error('No se pudo crear el pedido. Intentá de nuevo.')
    }

    return await invokeMercadoPagoFunction<{ checkoutUrl: string }>(supabase, 'mercadopago-checkout', {
      storeOrderId: order.id,
      slug,
    })
  } catch (err) {
    console.error('createMercadoPagoCheckout:', err instanceof Error ? err.message : err)
    throw err
  }
}
