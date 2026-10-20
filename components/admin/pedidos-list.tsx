'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  CreditCard,
  Download,
  Landmark,
  Mail,
  MessageCircle,
  Phone,
  Search,
  StickyNote,
  Store,
  Truck,
  User,
  X,
} from 'lucide-react'
import { confirmOrder, cancelOrder, refundOrder, markOrderShipped } from '@/app/admin/actions'
import { formatPrice, timeAgo } from '@/lib/format'
import { orderState, PAYMENT_LABEL } from '@/lib/orders'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Avatar, ErrorText, PageHeader } from '@/components/admin/ui'

type OrderItem = {
  id: string
  product_name: string
  size: string | null
  quantity: number
  unit_price: number | null
}

type Order = {
  id: string
  order_number: number
  status: string
  created_at: string
  payment_method: string
  mp_status: string | null
  subtotal: number | null
  mp_fee_amount: number | null
  total: number | null
  delivery_method: string | null
  shipping_carrier: string | null
  shipping_cost: number | null
  shipping_original_cost: number | null
  shipping_street: string | null
  shipping_number: string | null
  shipping_floor_apartment: string | null
  shipping_city: string | null
  shipping_province: string | null
  shipping_postal_code: string | null
  tracking_code: string | null
  shipped_at: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  customer_note: string | null
  store_order_items: OrderItem[]
}

type Filter = 'atender' | 'todos' | 'confirmados' | 'cancelados'
type Range = 'todo' | '7' | '30' | '90'

const CARRIER_LABEL: Record<string, string> = {
  correo_argentino: 'Correo Argentino',
  andreani: 'Andreani',
  envia: 'Envia.com',
}

const TONE_CLASS = { ok: 'adm-b-ok', warn: 'adm-b-warn', bad: 'adm-b-bad', info: 'adm-b-info', gray: 'adm-b-gray' }

const PAYMENT_ICON: Record<string, typeof CreditCard> = {
  mercadopago: CreditCard,
  transfer: Landmark,
  whatsapp: MessageCircle,
}

function matches(o: Order, f: Filter) {
  if (f === 'atender') return orderState(o).attention
  if (f === 'confirmados') return o.status === 'confirmed'
  if (f === 'cancelados') return o.status === 'cancelled' || o.status === 'refunded'
  return true
}

function itemsCount(o: Order) {
  return o.store_order_items.reduce((a, i) => a + i.quantity, 0)
}

function deliveryShort(o: Order) {
  if (o.delivery_method !== 'shipping') return 'Retira en el local'
  return o.shipping_city ? `Envío a ${o.shipping_city}` : 'Envío a domicilio'
}

// Link de WhatsApp al teléfono que dejó el cliente. Los números argentinos se cargan de mil
// formas; si quedan 10 dígitos (código de área + número) se asume celular y se antepone 549.
function whatsappLink(phone: string | null) {
  if (!phone) return null
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('0')) d = d.slice(1)
  if (d.length === 10) d = '549' + d
  return d.length >= 10 ? `https://wa.me/${d}` : null
}

function exportCsv(orders: Order[]) {
  const header = ['Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Email', 'Estado', 'Pago', 'Entrega', 'Productos', 'Total']
  const rows = orders.map((o) => [
    o.order_number,
    new Date(o.created_at).toLocaleString('es-AR'),
    o.customer_name ?? '',
    o.customer_phone ?? '',
    o.customer_email ?? '',
    orderState(o).label,
    PAYMENT_LABEL[o.payment_method] ?? o.payment_method,
    deliveryShort(o),
    o.store_order_items.map((i) => `${i.quantity}x ${i.product_name}${i.size ? ` (${i.size})` : ''}`).join(' | '),
    o.total ?? '',
  ])
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  // BOM para que Excel abra bien los acentos.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function PedidosList({
  orders,
  initialId,
  initialSearch = '',
  initialFilter,
}: {
  orders: Order[]
  initialId?: string
  initialSearch?: string
  initialFilter?: Filter
}) {
  const attentionCount = useMemo(() => orders.filter((o) => orderState(o).attention).length, [orders])
  const [filter, setFilter] = useState<Filter>(initialFilter ?? (attentionCount > 0 ? 'atender' : 'todos'))
  const [search, setSearch] = useState(initialSearch)
  const [range, setRange] = useState<Range>('todo')
  const [selectedId, setSelectedId] = useState<string | undefined>(initialId)
  const [mobileOpen, setMobileOpen] = useState(!!initialId)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, '')
    const since = range === 'todo' ? 0 : Date.now() - Number(range) * 86400000
    return orders.filter(
      (o) =>
        matches(o, filter) &&
        (!since || new Date(o.created_at).getTime() >= since) &&
        (!q || String(o.order_number).includes(q) || (o.customer_name ?? '').toLowerCase().includes(q)),
    )
  }, [orders, filter, search, range])

  const selected = orders.find((o) => o.id === selectedId) ?? filtered[0]

  const chips: { value: Filter; label: string; count?: number }[] = [
    { value: 'atender', label: 'Por atender', count: attentionCount },
    { value: 'todos', label: 'Todos' },
    { value: 'confirmados', label: 'Confirmados' },
    { value: 'cancelados', label: 'Cancelados' },
  ]

  const headerDesc =
    attentionCount > 0
      ? `${attentionCount} ${attentionCount === 1 ? 'necesita' : 'necesitan'} tu atención`
      : 'Todo al día. Confirmar un pedido descuenta el stock de verdad.'

  if (orders.length === 0) {
    return (
      <>
        <PageHeader title="Pedidos" />
        <div className="adm-card px-6 py-16 text-center">
          <p className="text-[15px] font-medium">Todavía no entró ningún pedido.</p>
          <p className="mt-1 adm-hint">Cuando alguien compre en tu tienda lo vas a ver acá.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Pedidos"
        description={headerDesc}
        actions={
          <div className="hidden gap-2 md:flex">
            <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="adm-input !min-h-[40px] !w-auto">
              <option value="todo">Todas las fechas</option>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
            <button type="button" className="adm-btn" onClick={() => exportCsv(filtered)} disabled={!filtered.length}>
              <Download />
              Exportar
            </button>
          </div>
        }
      />

      {/* Filtros del celular */}
      <div className="mb-3 md:hidden">
        <label className="mb-2.5 flex items-center gap-2 rounded-[10px] bg-white px-3" style={{ border: '1px solid var(--adm-line)' }}>
          <Search className="h-[17px] w-[17px]" style={{ color: 'var(--adm-soft)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre o n.º de pedido…"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none"
          />
        </label>
        <div className="adm-scroll-x -mx-4 px-4">
          {chips.map((c) => (
            <button key={c.value} type="button" className="adm-chip" data-on={filter === c.value} onClick={() => setFilter(c.value)}>
              {c.label} {c.count !== undefined && <span className="n">{c.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="adm-card overflow-hidden">
          <div className="hidden flex-col gap-2.5 px-3.5 py-3 md:flex" style={{ borderBottom: '1px solid var(--adm-line)' }}>
            <label className="flex items-center gap-2 rounded-[10px] bg-white px-3" style={{ border: '1px solid var(--adm-line)' }}>
              <Search className="h-4 w-4" style={{ color: 'var(--adm-soft)' }} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o n.º de pedido…"
                className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button key={c.value} type="button" className="adm-chip" data-on={filter === c.value} onClick={() => setFilter(c.value)}>
                  {c.label} {c.count !== undefined && <span className="n">{c.count}</span>}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-12 text-center adm-hint">
              {filter === 'atender' ? 'No hay pedidos esperando. ¡Todo al día!' : 'Ningún pedido coincide con esos filtros.'}
            </p>
          ) : (
            <div className="md:max-h-[calc(100vh-260px)] md:overflow-y-auto">
              {filtered.map((o) => {
                const st = orderState(o)
                const PayIcon = PAYMENT_ICON[o.payment_method] ?? CreditCard
                const isSel = selected?.id === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(o.id)
                      setMobileOpen(true)
                    }}
                    className={`flex w-full items-start gap-3 px-3.5 py-3 text-left md:px-4 [&:not(:last-child)]:border-b ${isSel ? 'md:bg-[#fafaf8] md:shadow-[inset_3px_0_0_var(--adm-ink)]' : ''}`}
                    style={{ borderColor: 'var(--adm-line2)' }}
                  >
                    <Avatar name={o.customer_name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-2">
                        <b className="truncate font-medium">
                          #{o.order_number}
                          {o.customer_name ? ` · ${o.customer_name}` : ''}
                        </b>
                        <b className="flex-shrink-0 font-semibold">{formatPrice(o.total)}</b>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
                        <PayIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {PAYMENT_LABEL[o.payment_method] ?? o.payment_method} · {itemsCount(o)} prod. · {timeAgo(o.created_at)}
                        </span>
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`adm-badge ${TONE_CLASS[st.tone]}`}>{st.label}</span>
                        <span className="text-[12px]" style={{ color: 'var(--adm-soft)' }}>
                          {deliveryShort(o)}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="hidden md:block">{selected && <OrderDetail key={selected.id} order={selected} />}</div>
      </div>

      {/* Detalle en el celular: pantalla completa por encima de todo, con flecha para volver. */}
      {mobileOpen && selected && (
        <div className="adm fixed inset-0 z-50 overflow-y-auto pb-28 md:hidden" style={{ backgroundColor: '#fff' }}>
          <div className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-white px-2" style={{ borderBottom: '1px solid var(--adm-line)' }}>
            <button type="button" onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center" aria-label="Volver">
              <ArrowLeft className="h-[22px] w-[22px]" />
            </button>
            <span className="flex-1" style={{ color: 'var(--adm-muted)' }}>
              Pedidos
            </span>
          </div>
          <OrderDetail key={selected.id} order={selected} mobile />
        </div>
      )}
    </>
  )
}

function OrderDetail({ order, mobile }: { order: Order; mobile?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'refund' | null>(null)

  const st = orderState(order)
  const isShipping = order.delivery_method === 'shipping'
  const freeShipping = order.shipping_original_cost != null && order.shipping_original_cost > (order.shipping_cost ?? 0)
  const canRefund =
    order.payment_method === 'mercadopago' && (order.status === 'confirmed' || (order.status === 'pending' && order.mp_status === 'approved'))
  const wa = whatsappLink(order.customer_phone)

  async function run(fn: () => Promise<unknown>, fallback: string) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback)
    } finally {
      setBusy(false)
    }
  }

  // Pasos del pedido: recibido → pagado → (enviado, si es con envío).
  const paid = order.status === 'confirmed'
  const steps = [
    { label: 'Recibido', done: true },
    { label: 'Pagado', done: paid },
    ...(isShipping ? [{ label: 'Enviado', done: paid && !!order.tracking_code }] : []),
  ]
  const currentStep = steps.findIndex((s) => !s.done)
  const ended = order.status === 'cancelled' || order.status === 'refunded'

  const confirmLabel =
    order.payment_method === 'transfer' ? 'Confirmar pago' : order.payment_method === 'whatsapp' ? 'Confirmar venta' : 'Marcar como vendido'

  const sec = 'px-4 py-3.5 md:px-5 md:py-4 [&:not(:last-child)]:border-b'
  const h4 = 'mb-2.5 text-[12px] font-medium uppercase tracking-[0.06em]'

  const actions = (order.status === 'pending' || canRefund) && (
    <div
      className={
        mobile
          ? 'fixed inset-x-0 bottom-0 z-20 flex gap-2 bg-[#fbfbfa] px-4 pt-3'
          : 'flex gap-2 rounded-b-[14px] bg-[#fbfbfa] px-5 py-3.5'
      }
      style={{ borderTop: '1px solid var(--adm-line)', paddingBottom: mobile ? 'max(16px, env(safe-area-inset-bottom))' : undefined }}
    >
      {order.status === 'pending' && (
        <button type="button" disabled={busy} onClick={() => setConfirmAction('cancel')} className={`adm-btn ${mobile ? 'flex-1 !py-3' : ''}`}>
          <X />
          Cancelar
        </button>
      )}
      {canRefund && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmAction('refund')}
          className={`adm-btn adm-btn-danger ${mobile ? 'flex-1 !py-3' : ''}`}
        >
          {busy ? 'Procesando…' : 'Reembolsar'}
        </button>
      )}
      {!mobile && <span className="flex-1" />}
      {order.status === 'pending' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => confirmOrder(order.id), 'Error al confirmar')}
          className={`adm-btn adm-btn-pri ${mobile ? 'flex-1 !py-3' : ''}`}
        >
          <Check />
          {busy ? 'Confirmando…' : confirmLabel}
        </button>
      )}
    </div>
  )

  return (
    <div className={mobile ? '' : 'adm-card'}>
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction === 'refund' ? 'Reembolsar pedido' : 'Cancelar pedido'}
        message={
          confirmAction === 'refund'
            ? `¿Reembolsar el pedido #${order.order_number}? Se le devuelve la plata al cliente por Mercado Pago y el stock vuelve a la tienda. Puede tardar unos segundos.`
            : `¿Cancelar el pedido #${order.order_number}? No se puede deshacer.`
        }
        confirmText={confirmAction === 'refund' ? 'Reembolsar' : 'Cancelar pedido'}
        cancelText="Volver"
        danger
        onConfirm={() => {
          const a = confirmAction
          setConfirmAction(null)
          if (a === 'refund') run(() => refundOrder(order.id), 'Error al reembolsar')
          else run(() => cancelOrder(order.id), 'Error al cancelar')
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <div className={sec} style={{ borderColor: 'var(--adm-line2)' }}>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[20px] font-semibold">Pedido #{order.order_number}</h2>
          <span className={`adm-badge ${TONE_CLASS[st.tone]}`}>{st.label}</span>
        </div>
        <p className="mt-1 text-[13.5px]" style={{ color: 'var(--adm-muted)' }}>
          {new Date(order.created_at).toLocaleString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Argentina/Buenos_Aires',
          })}{' '}
          · {timeAgo(order.created_at)}
        </p>
      </div>

      {!ended && (
        <div className={sec} style={{ borderColor: 'var(--adm-line2)' }}>
          <div className="flex items-center">
            {steps.map((s, i) => {
              const cur = i === currentStep
              return (
                <div key={s.label} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
                  <span className="flex items-center gap-2 text-[13px]" style={{ color: s.done || cur ? 'var(--adm-ink)' : 'var(--adm-soft)', fontWeight: cur ? 600 : 400 }}>
                    <span
                      className="grid h-[22px] w-[22px] place-items-center rounded-full text-[11px] font-semibold"
                      style={
                        s.done
                          ? { backgroundColor: 'var(--adm-ink)', color: '#fff' }
                          : cur
                            ? { border: '2px solid var(--adm-warn)', color: 'var(--adm-warn)' }
                            : { border: '2px solid #dcdcd8' }
                      }
                    >
                      {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                    </span>
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="mx-2.5 h-0.5 min-w-4 flex-1" style={{ backgroundColor: s.done && steps[i + 1].done ? 'var(--adm-ink)' : '#e4e4e0' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Callout order={order} />

      {isShipping && order.status === 'confirmed' && (
        <div className={sec} style={{ borderColor: 'var(--adm-line2)' }}>
          {order.tracking_code ? (
            <div className="adm-alert" style={{ backgroundColor: 'var(--adm-ok-soft)', color: '#14532d' }}>
              <Truck />
              <div>
                <b>Enviado</b> · código de seguimiento <b>{order.tracking_code}</b>
                {order.shipped_at && <span style={{ opacity: 0.75 }}> ({new Date(order.shipped_at).toLocaleDateString('es-AR')})</span>}
              </div>
            </div>
          ) : (
            <TrackingCodeForm orderId={order.id} />
          )}
        </div>
      )}

      <div className={sec} style={{ borderColor: 'var(--adm-line2)' }}>
        <h4 className={h4} style={{ color: 'var(--adm-muted)' }}>
          Productos
        </h4>
        <ul className="flex flex-col gap-2">
          {order.store_order_items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-[12px] font-semibold" style={{ backgroundColor: 'var(--adm-bg)' }}>
                {item.quantity}×
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate font-medium">{item.product_name}</b>
                <span className="text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
                  {item.size ? `${item.size} · ` : ''}
                  {item.unit_price != null ? `${item.quantity} × ${formatPrice(item.unit_price)}` : ''}
                </span>
              </span>
              {item.unit_price != null && <b className="font-semibold">{formatPrice(item.unit_price * item.quantity)}</b>}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-1 text-[13.5px]">
          {order.subtotal != null && (
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          )}
          {isShipping ? (
            <Row
              label={order.shipping_carrier ? `Envío (${CARRIER_LABEL[order.shipping_carrier] ?? order.shipping_carrier})` : 'Envío'}
              value={
                freeShipping ? (
                  <span style={{ color: 'var(--adm-ok)' }}>
                    Gratis <s style={{ color: 'var(--adm-soft)' }}>{formatPrice(order.shipping_original_cost)}</s>
                  </span>
                ) : (
                  formatPrice(order.shipping_cost)
                )
              }
            />
          ) : (
            <Row label="Envío" value="Retira en el local" />
          )}
          {order.payment_method === 'mercadopago' && !!order.mp_fee_amount && order.mp_fee_amount > 0 && (
            <Row label="Comisión de servicio" value={formatPrice(order.mp_fee_amount)} />
          )}
          <div className="mt-1.5 flex justify-between pt-2 text-[16px] font-semibold" style={{ borderTop: '1px dashed var(--adm-line)' }}>
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className={`${sec} grid grid-cols-1 gap-4 lg:grid-cols-2`} style={{ borderColor: 'var(--adm-line2)' }}>
        <div>
          <h4 className={h4} style={{ color: 'var(--adm-muted)' }}>
            Cliente
          </h4>
          {order.customer_name && <Kv icon={<User />}>{order.customer_name}</Kv>}
          {order.customer_phone && (
            <Kv icon={<Phone />}>
              <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
            </Kv>
          )}
          {order.customer_email && (
            <Kv icon={<Mail />}>
              <a href={`mailto:${order.customer_email}`} className="break-all">
                {order.customer_email}
              </a>
            </Kv>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="adm-btn adm-btn-sm mt-2">
              <MessageCircle />
              Escribir por WhatsApp
            </a>
          )}
        </div>
        <div>
          <h4 className={h4} style={{ color: 'var(--adm-muted)' }}>
            Entrega
          </h4>
          {isShipping ? (
            <Kv icon={<Truck />}>
              {order.shipping_street} {order.shipping_number}
              {order.shipping_floor_apartment ? `, ${order.shipping_floor_apartment}` : ''}
              <br />
              <span style={{ color: 'var(--adm-muted)' }}>
                {order.shipping_city}, {order.shipping_province} (CP {order.shipping_postal_code})
              </span>
            </Kv>
          ) : (
            <Kv icon={<Store />}>Retira en el local</Kv>
          )}
          {order.customer_note && (
            <Kv icon={<StickyNote />}>
              <span style={{ color: 'var(--adm-muted)' }}>“{order.customer_note}”</span>
            </Kv>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 pb-3 md:px-5">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {actions}
    </div>
  )
}

function Callout({ order }: { order: Order }) {
  if (order.status !== 'pending') return null
  let tone: React.CSSProperties = { backgroundColor: 'var(--adm-warn-soft)', color: '#7c3d06' }
  let icon = <Landmark />
  let title = ''
  let text = ''
  if (order.payment_method === 'transfer') {
    title = 'Pagó por transferencia'
    text = `Revisá que llegaron ${formatPrice(order.total)} a tu cuenta (y el comprobante en tu email) antes de confirmar.`
  } else if (order.payment_method === 'whatsapp') {
    icon = <MessageCircle />
    title = 'Pedido por WhatsApp'
    text = 'Coordiná el pago y la entrega con el cliente, y confirmá cuando lo cobres.'
  } else if (order.mp_status === 'approved') {
    tone = { backgroundColor: 'var(--adm-bad-soft)', color: '#7f1d1d' }
    icon = <CreditCard />
    title = 'Pagado, pero sin stock'
    text = 'Mercado Pago cobró y no había stock para descontar. Reponé y marcalo como vendido, o reembolsá.'
  } else {
    tone = { backgroundColor: '#f0f0ee', color: '#3b3b42' }
    icon = <CreditCard />
    title = 'Esperando el pago'
    text = 'El cliente todavía no terminó de pagar en Mercado Pago. Se confirma solo cuando paga.'
  }
  return (
    <div className="px-4 py-3.5 md:px-5 md:py-4" style={{ borderBottom: '1px solid var(--adm-line2)' }}>
      <div className="adm-alert" style={tone}>
        {icon}
        <div>
          <b className="block">{title}</b>
          <span className="text-[13px]">{text}</span>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3" style={{ color: 'var(--adm-muted)' }}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

function Kv({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-1 [&>svg]:mt-0.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:flex-shrink-0 [&>svg]:text-[var(--adm-soft)]">
      {icon}
      <span className="min-w-0">{children}</span>
    </div>
  )
}

function TrackingCodeForm({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setSaving(true)
    setError('')
    try {
      await markOrderShipped(orderId, code.trim())
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el código')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-3.5" style={{ backgroundColor: 'var(--adm-info-soft)' }}>
      <p className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: 'var(--adm-info)' }}>
        <Truck className="h-4 w-4" />
        Pagado, falta despachar
      </p>
      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código de seguimiento"
          className="adm-input flex-1"
        />
        <button type="submit" disabled={saving || !code.trim()} className="adm-btn adm-btn-pri">
          {saving ? 'Guardando…' : 'Marcar como enviado'}
        </button>
      </div>
      <p className="mt-1.5 text-[12px]" style={{ color: 'var(--adm-info)' }}>
        Le mandamos un email al cliente avisándole con este código.
      </p>
      {error && (
        <div className="mt-1.5">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </form>
  )
}
