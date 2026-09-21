import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteShell } from '@/components/site-shell'
import { getStoreBySlug } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/format'

type PublicOrderItem = {
  product_name: string
  size: string | null
  quantity: number
  unit_price: number | null
  subtotal: number | null
}

type PublicOrder = {
  id: string
  order_number: number
  organization_id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  mp_status: string | null
  subtotal: number | null
  total: number | null
  delivery_method: 'pickup' | 'shipping' | null
  shipping_carrier: 'correo_argentino' | 'andreani' | null
  shipping_street: string | null
  shipping_number: string | null
  shipping_floor_apartment: string | null
  shipping_city: string | null
  shipping_province: string | null
  shipping_postal_code: string | null
  shipping_cost: number | null
  shipping_original_cost: number | null
  tracking_code: string | null
  shipped_at: string | null
  created_at: string
  confirmed_at: string | null
  items: PublicOrderItem[]
}

const CARRIER_LABEL: Record<string, string> = {
  correo_argentino: 'Correo Argentino',
  andreani: 'Andreani',
}

const STATUS_COPY: Record<PublicOrder['status'], { title: string; text: string; color: string }> = {
  confirmed: {
    title: '¡Listo, tu pedido fue confirmado!',
    text: 'Te mandamos un email con este mismo detalle.',
    color: '#16a34a',
  },
  pending: {
    title: 'Estamos confirmando tu pago',
    text: 'Puede tardar unos segundos. Si ya pagaste, en breve te va a llegar un email de confirmación — no hace falta que hagas nada más.',
    color: '#6b6b6b',
  },
  cancelled: {
    title: 'Este pedido fue cancelado',
    text: 'Si te descontaron el pago y no reconocés esta cancelación, contactanos.',
    color: '#d81b8a',
  },
  refunded: {
    title: 'Este pedido fue reembolsado',
    text: 'El dinero ya fue devuelto a tu medio de pago.',
    color: '#d81b8a',
  },
}

// Acceso público: no hay sesión acá (el cliente que paga no tiene cuenta). La autorización es
// posesión del UUID del pedido, no auth.uid() -- ver get_public_store_order (migración
// 20260918120000), que es la única puerta de lectura pública a store_orders. El chequeo de
// organization_id de abajo es defensa en profundidad, no la autorización real.
export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>
}) {
  const { slug, orderId } = await params
  const store = await getStoreBySlug(slug)
  if (!store) notFound()

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_public_store_order', { p_store_order_id: orderId })
  if (error) console.error('get_public_store_order:', error.message)

  const order = data as PublicOrder | null
  if (!order || order.organization_id !== store.organizationId) notFound()

  const statusCopy = STATUS_COPY[order.status]
  const hasAddress = order.delivery_method === 'shipping' && !!order.shipping_street

  return (
    <SiteShell store={store}>
      <div className="mx-auto max-w-[640px] px-6 py-16">
        <p className="text-[12px] uppercase" style={{ letterSpacing: '0.08em', color: '#6b6b6b' }}>
          Pedido #{order.order_number}
        </p>
        <h1 className="mt-2 text-[24px] font-medium" style={{ color: '#111111' }}>
          {statusCopy.title}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: statusCopy.color }}>
          {statusCopy.text}
        </p>

        <div className="mt-10 flex flex-col gap-3" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1.5rem' }}>
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px]" style={{ color: '#111111' }}>
                  {item.product_name}
                  {item.size ? ` — ${item.size}` : ''}
                </p>
                <p className="text-[12px]" style={{ color: '#6b6b6b' }}>x{item.quantity}</p>
              </div>
              {item.subtotal != null && (
                <span className="text-[14px]" style={{ color: '#111111' }}>
                  {formatPrice(item.subtotal)}
                </span>
              )}
            </div>
          ))}
        </div>

        {hasAddress && (
          <div className="mt-6 text-[13px]" style={{ color: '#6b6b6b' }}>
            <p className="mb-1 text-[12px] uppercase" style={{ letterSpacing: '0.06em' }}>
              Envío a
            </p>
            <p>
              {order.shipping_street} {order.shipping_number}
              {order.shipping_floor_apartment ? `, ${order.shipping_floor_apartment}` : ''}
            </p>
            <p>
              {order.shipping_city}, {order.shipping_province} ({order.shipping_postal_code})
            </p>
          </div>
        )}

        {order.delivery_method === 'shipping' && order.tracking_code && (
          <div className="mt-4 p-3 text-[13px]" style={{ backgroundColor: '#eafaf0', color: '#111111' }}>
            Enviado por {CARRIER_LABEL[order.shipping_carrier ?? ''] ?? order.shipping_carrier} — código de
            seguimiento: <strong>{order.tracking_code}</strong>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1.5rem' }}>
          {order.delivery_method === 'shipping' && (
            <div className="flex items-center justify-between text-[13px]" style={{ color: '#6b6b6b' }}>
              <span>Envío</span>
              <span>
                {order.shipping_original_cost != null && order.shipping_original_cost > (order.shipping_cost ?? 0) ? (
                  <>
                    <span style={{ color: '#16a34a' }}>Gratis</span>{' '}
                    <span style={{ textDecoration: 'line-through' }}>{formatPrice(order.shipping_original_cost)}</span>
                  </>
                ) : (
                  formatPrice(order.shipping_cost)
                )}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[14px]" style={{ color: '#6b6b6b' }}>
              Total
            </span>
            <span className="text-[18px] font-medium" style={{ color: '#111111' }}>
              {formatPrice(order.total)}
            </span>
          </div>
        </div>

        <Link href={`/${slug}`} className="pc-btn mt-10 inline-block px-6 py-3 text-[14px]">
          ← Volver a la tienda
        </Link>
      </div>
    </SiteShell>
  )
}
