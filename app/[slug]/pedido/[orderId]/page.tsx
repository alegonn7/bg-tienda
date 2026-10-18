import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteShell } from '@/components/site-shell'
import { getStoreBySlug } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/format'
import { Check, Clock, CreditCard, Hash, Info, Landmark, Package, Truck, X } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { WhatsAppIcon } from '@/components/store/icons'
import { storeName, whatsappUrl } from '@/lib/store-info'

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
  payment_method: 'whatsapp' | 'mercadopago' | 'transfer'
  mp_status: string | null
  subtotal: number | null
  mp_fee_amount: number | null
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

// El estado del pedido cambia (pago confirmado, envío, etc.) — nunca cachear esta página.
export const dynamic = 'force-dynamic'

const CARRIER_LABEL: Record<string, string> = {
  correo_argentino: 'Correo Argentino',
  andreani: 'Andreani',
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

  const isPendingTransfer = order.status === 'pending' && order.payment_method === 'transfer'
  const closed = order.status === 'cancelled' || order.status === 'refunded'
  const shipping = order.delivery_method === 'shipping'
  const hasAddress = shipping && !!order.shipping_street
  const wa = whatsappUrl(store, `Hola ${storeName(store)}! Te escribo por mi pedido #${order.order_number}.`)
  const subtotal = order.items.reduce((sum, i) => sum + (i.subtotal ?? 0), 0)

  const hero = closed
    ? {
        title: order.status === 'cancelled' ? 'Este pedido fue cancelado' : 'Este pedido fue reembolsado',
        text: order.status === 'cancelled' ? 'Si te descontaron el pago y no reconocés esta cancelación, escribinos.' : 'El dinero ya fue devuelto a tu medio de pago.',
      }
    : order.status === 'confirmed'
      ? { title: '¡Listo, tu pedido está confirmado!', text: 'Te mandamos un email con este mismo detalle.' }
      : isPendingTransfer
        ? { title: '¡Gracias! Recibimos tu pedido', text: 'Hacé la transferencia y mandanos el comprobante: cuando lo confirmemos te llega un email.' }
        : { title: 'Estamos confirmando tu pago', text: 'Puede tardar unos segundos. Si ya pagaste, te va a llegar un email de confirmación: no hace falta que hagas nada más.' }

  // Pasos del pedido. Lo que no sabemos (si ya está preparado) no se marca como hecho.
  const paid = order.status === 'confirmed'
  const shipped = !!order.shipped_at
  const steps = [
    { Icon: Check, label: 'Recibido', state: 'done' },
    { Icon: isPendingTransfer ? Landmark : CreditCard, label: paid ? 'Pago confirmado' : 'Esperando pago', state: paid ? 'done' : 'cur' },
    { Icon: Package, label: shipping ? 'Preparando' : 'Para retirar', state: paid && !shipped ? 'cur' : shipped ? 'done' : 'todo' },
    ...(shipping ? [{ Icon: Truck, label: 'En camino', state: shipped ? 'done' : 'todo' }] : []),
  ] as { Icon: typeof Check; label: string; state: 'done' | 'cur' | 'todo' }[]
  const doneCount = steps.filter((s) => s.state === 'done').length

  return (
    <SiteShell store={store}>
      <div className="st-wrap">
        <div className="pb-[22px] pt-8 text-center md:pb-[30px] md:pt-12">
          <span
            className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-full"
            style={closed ? { backgroundColor: '#fdecec', color: 'var(--st-bad)' } : order.status === 'pending' && !isPendingTransfer ? { backgroundColor: 'var(--st-sf)', color: 'var(--st-ink)' } : { backgroundColor: 'var(--st-ok-soft)', color: 'var(--st-ok)' }}
          >
            {closed ? <X className="h-[34px] w-[34px]" strokeWidth={2.2} /> : order.status === 'pending' && !isPendingTransfer ? <Clock className="h-[34px] w-[34px]" strokeWidth={2} /> : <Check className="h-[34px] w-[34px]" strokeWidth={2.2} />}
          </span>
          <h1 className="mt-[18px] text-balance text-[26px] font-bold tracking-[-0.02em] md:text-[34px]">{hero.title}</h1>
          <p className="mx-auto mt-2 max-w-[560px] text-[15px] md:text-[16px]" style={{ color: 'var(--st-mut)' }}>
            {hero.text}
          </p>
          <span className="mt-4 inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold" style={{ backgroundColor: 'var(--st-sf)' }}>
            <Hash className="h-[15px] w-[15px]" />
            Pedido {order.order_number}
          </span>
        </div>

        <div className="mx-auto grid max-w-[1040px] gap-[18px] md:grid-cols-[1fr_400px] md:gap-8">
          <div className="grid content-start gap-[18px]">
            {isPendingTransfer && (store.transferAlias || store.transferCbu) && (
              <div className="rounded-2xl p-[18px] md:rounded-[20px] md:p-6" style={{ backgroundColor: 'var(--st-warn-soft)' }}>
                <h3 className="mb-4 flex items-center gap-2 text-[17px] font-bold" style={{ color: '#7a3d06' }}>
                  <Landmark className="h-[18px] w-[18px]" />
                  Falta un paso: hacé la transferencia
                </h3>
                <p className="text-[26px] font-bold tracking-[-0.01em] md:text-[30px]">
                  {formatPrice(order.total)}
                  <small className="block text-[13px] font-medium tracking-normal" style={{ color: '#8a5a2b' }}>
                    Total a transferir
                  </small>
                </p>
                {store.transferAlias && (
                  <div className="mt-2.5 flex items-center gap-3 rounded-xl bg-white px-3.5 py-3">
                    <div className="min-w-0">
                      <small className="block text-[12px]" style={{ color: 'var(--st-mut)' }}>Alias</small>
                      <b className="break-all text-[15px]">{store.transferAlias}</b>
                    </div>
                    <CopyButton value={store.transferAlias} label="alias" />
                  </div>
                )}
                {store.transferCbu && (
                  <div className="mt-2.5 flex items-center gap-3 rounded-xl bg-white px-3.5 py-3">
                    <div className="min-w-0">
                      <small className="block text-[12px]" style={{ color: 'var(--st-mut)' }}>CBU / CVU</small>
                      <b className="break-all text-[14px] md:text-[15px]">{store.transferCbu}</b>
                    </div>
                    <CopyButton value={store.transferCbu} label="CBU" />
                  </div>
                )}
                <p className="mt-3.5 flex gap-2 text-[13px]" style={{ color: '#7a3d06' }}>
                  <Info className="mt-px h-4 w-4 flex-shrink-0" />
                  <span>
                    Cuando transfieras, mandá el comprobante
                    {store.transferReceiptEmail ? (
                      <>
                        {' '}a <b>{store.transferReceiptEmail}</b>
                      </>
                    ) : null}
                    {wa ? ' o por WhatsApp' : ''} mencionando el pedido #{order.order_number}.
                  </span>
                </p>
              </div>
            )}

            {!closed && (
              <div className="rounded-2xl border p-[18px] md:rounded-[20px] md:p-6" style={{ borderColor: 'var(--st-line)' }}>
                <h3 className="mb-4 text-[17px] font-bold">Estado del pedido</h3>
                <div className="relative grid" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
                  <span className="absolute top-[15px] h-0.5" style={{ left: `${50 / steps.length}%`, right: `${50 / steps.length}%`, backgroundColor: 'var(--st-line)' }} />
                  <span className="absolute top-[15px] h-0.5" style={{ left: `${50 / steps.length}%`, width: `${(Math.max(0, doneCount - 1) / steps.length) * 100}%`, backgroundColor: 'var(--st-ink)' }} />
                  {steps.map(({ Icon, label, state }) => (
                    <div key={label} className="relative z-[1] text-center text-[11px] md:text-[13px]" style={{ color: state === 'todo' ? 'var(--st-soft)' : 'var(--st-ink)', fontWeight: state === 'cur' ? 600 : 400 }}>
                      <span
                        className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full border-2"
                        style={state === 'done' ? { backgroundColor: 'var(--st-ink)', borderColor: 'var(--st-ink)', color: '#fff' } : { backgroundColor: '#fff', borderColor: state === 'cur' ? 'var(--st-ink)' : 'var(--st-line)' }}
                      >
                        <Icon className="h-[15px] w-[15px]" />
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
                {shipped && order.tracking_code && (
                  <p className="mt-5 rounded-[10px] px-3.5 py-2.5 text-[14px]" style={{ backgroundColor: 'var(--st-ok-soft)' }}>
                    {order.shipping_carrier ? `Enviado por ${CARRIER_LABEL[order.shipping_carrier] ?? order.shipping_carrier}` : 'Enviado'} · código de seguimiento: <b>{order.tracking_code}</b>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid content-start gap-[18px]">
            <div className="rounded-2xl border p-[18px] md:rounded-[20px] md:p-6" style={{ borderColor: 'var(--st-line)' }}>
              <h3 className="mb-2 text-[17px] font-bold">Resumen</h3>
              <ul>
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b py-2.5 text-[14px]" style={{ borderColor: 'var(--st-line2)' }}>
                    <span>
                      {item.product_name}
                      <span className="block text-[13px]" style={{ color: 'var(--st-mut)' }}>
                        {item.size ? `Talle ${item.size} · ` : ''}x{item.quantity}
                      </span>
                    </span>
                    {item.subtotal != null && <b className="whitespace-nowrap">{formatPrice(item.subtotal)}</b>}
                  </li>
                ))}
              </ul>
              <div className="mt-3 grid gap-2 text-[14px]">
                {subtotal > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--st-mut)' }}>Subtotal</span>
                    {formatPrice(order.subtotal ?? subtotal)}
                  </div>
                )}
                {shipping && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--st-mut)' }}>Envío</span>
                    {order.shipping_original_cost != null && order.shipping_original_cost > (order.shipping_cost ?? 0) ? (
                      <span>
                        <span style={{ color: 'var(--st-ok)' }}>Gratis</span>{' '}
                        <s style={{ color: 'var(--st-soft)' }}>{formatPrice(order.shipping_original_cost)}</s>
                      </span>
                    ) : (
                      formatPrice(order.shipping_cost)
                    )}
                  </div>
                )}
                {!!order.mp_fee_amount && order.mp_fee_amount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--st-mut)' }}>Servicio Mercado Pago</span>
                    {formatPrice(order.mp_fee_amount)}
                  </div>
                )}
                {order.total != null && (
                  <div className="flex justify-between border-t pt-2 text-[16px] font-bold" style={{ borderColor: 'var(--st-line2)' }}>
                    <span>Total</span>
                    {formatPrice(order.total)}
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border p-[18px] md:rounded-[20px] md:p-6" style={{ borderColor: 'var(--st-line)' }}>
              <h3 className="mb-3 text-[17px] font-bold">Entrega</h3>
              {hasAddress ? (
                <p className="text-[14px]">
                  <span className="block" style={{ color: 'var(--st-mut)' }}>Envío a</span>
                  {order.shipping_street} {order.shipping_number}
                  {order.shipping_floor_apartment ? `, ${order.shipping_floor_apartment}` : ''}
                  <br />
                  {order.shipping_city}, {order.shipping_province} ({order.shipping_postal_code})
                </p>
              ) : (
                <p className="text-[14px]">Retirás en el local. Te avisamos cuando esté listo.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-2.5 md:mt-9 md:flex-row">
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="st-btn st-btn-wa st-btn-lg">
              <WhatsAppIcon />
              {isPendingTransfer ? 'Mandar comprobante por WhatsApp' : 'Escribinos por WhatsApp'}
            </a>
          )}
          <Link href={`/${slug}/productos`} className="st-btn st-btn-ghost st-btn-lg">
            Seguir comprando
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
