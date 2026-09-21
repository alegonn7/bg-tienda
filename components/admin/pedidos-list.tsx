'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmOrder, cancelOrder, refundOrder, markOrderShipped } from '@/app/admin/actions'
import { formatPrice } from '@/lib/format'

const PAGE_SIZE = 10

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
  customer_note: string | null
  store_order_items: OrderItem[]
}

const CARRIER_LABEL: Record<string, string> = {
  correo_argentino: 'Correo Argentino',
  andreani: 'Andreani',
}

const STATUS_BADGE: Record<string, { text: string; color: string; bg: string }> = {
  pending: { text: 'Pendiente de pago', color: '#b45309', bg: '#fef3e2' },
  confirmed: { text: 'Confirmado', color: '#16a34a', bg: '#eafaf0' },
  cancelled: { text: 'Cancelado', color: '#6b6b6b', bg: '#f0f0ee' },
  refunded: { text: 'Reembolsado', color: '#6b6b6b', bg: '#f0f0ee' },
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span
      className="px-2.5 py-1 text-[11px] font-medium uppercase"
      style={{ letterSpacing: '0.04em', color, backgroundColor: bg }}
    >
      {text}
    </span>
  )
}

export function PedidosList({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function handleConfirm(id: string) {
    setBusyId(id)
    setError(null)
    try {
      await confirmOrder(id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar')
    } finally {
      setBusyId(null)
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('¿Cancelar este pedido? No se toca el stock.')) return
    setBusyId(id)
    setError(null)
    try {
      await cancelOrder(id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRefund(id: string) {
    if (!confirm('¿Reembolsar este pedido? Se le devuelve la plata al cliente en Mercado Pago y se restaura el stock.')) return
    setBusyId(id)
    setError(null)
    try {
      await refundOrder(id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reembolsar')
    } finally {
      setBusyId(null)
    }
  }

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center text-[14px]" style={{ color: '#6b6b6b' }}>
        Todavía no hay pedidos.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-[13px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}
      {paged.map((order) => {
        const badge = STATUS_BADGE[order.status] ?? { text: order.status, color: '#6b6b6b', bg: '#f0f0ee' }
        const isShipping = order.delivery_method === 'shipping'
        const freeShipping = order.shipping_original_cost != null && order.shipping_original_cost > (order.shipping_cost ?? 0)

        return (
          <div key={order.id} className="p-6" style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff' }}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-medium" style={{ color: '#111111' }}>
                  Pedido #{order.order_number}
                </span>
                <Badge {...badge} />
              </div>
              <span className="text-[12px]" style={{ color: '#6b6b6b' }}>
                {new Date(order.created_at).toLocaleString('es-AR')}
              </span>
            </div>

            {/* Items */}
            <ul className="mt-4 flex flex-col gap-1" style={{ borderTop: '1px solid #f0f0ee', paddingTop: '12px' }}>
              {order.store_order_items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-[14px]" style={{ color: '#111111' }}>
                  <span>
                    {item.quantity}× {item.product_name}
                    {item.size ? ` — ${item.size}` : ''}
                  </span>
                  {item.unit_price != null && (
                    <span style={{ color: '#6b6b6b' }}>{formatPrice(item.unit_price * item.quantity)}</span>
                  )}
                </li>
              ))}
            </ul>

            {/* Entrega */}
            <div className="mt-4 p-3 text-[13px]" style={{ backgroundColor: '#fafaf9', color: '#111111' }}>
              {isShipping ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>Envío por {CARRIER_LABEL[order.shipping_carrier ?? ''] ?? order.shipping_carrier ?? '—'}</span>
                    <span style={{ color: freeShipping ? '#16a34a' : '#111111' }}>
                      {freeShipping ? (
                        <>
                          Gratis{' '}
                          <span style={{ color: '#6b6b6b', textDecoration: 'line-through' }}>
                            {formatPrice(order.shipping_original_cost)}
                          </span>
                        </>
                      ) : (
                        formatPrice(order.shipping_cost)
                      )}
                    </span>
                  </div>
                  <p className="mt-1" style={{ color: '#6b6b6b' }}>
                    {order.shipping_street} {order.shipping_number}
                    {order.shipping_floor_apartment ? `, ${order.shipping_floor_apartment}` : ''},{' '}
                    {order.shipping_city}, {order.shipping_province} (CP {order.shipping_postal_code})
                  </p>
                </>
              ) : (
                <span style={{ color: '#6b6b6b' }}>Retira en el local</span>
              )}
            </div>

            {/* Contacto / nota */}
            {(order.customer_name || order.customer_note) && (
              <div className="mt-3 text-[13px]" style={{ color: '#111111' }}>
                {order.customer_name && (
                  <p>
                    {order.customer_name}
                    {order.customer_phone ? ` — ${order.customer_phone}` : ''}
                  </p>
                )}
                {order.customer_note && <p style={{ color: '#6b6b6b' }}>Nota: {order.customer_note}</p>}
              </div>
            )}

            {order.payment_method === 'mercadopago' && order.status === 'pending' && order.mp_status === 'approved' && (
              <p className="mt-3 p-3 text-[12px] font-medium" style={{ color: '#dc2626', backgroundColor: '#fdecec' }}>
                Pagado — sin stock, revisar
              </p>
            )}

            {/* Seguimiento del envío */}
            {isShipping && order.status === 'confirmed' && (
              <div className="mt-4">
                {order.tracking_code ? (
                  <div className="p-3 text-[13px]" style={{ backgroundColor: '#eafaf0', color: '#111111' }}>
                    Enviado — código de seguimiento: <strong>{order.tracking_code}</strong>
                    {order.shipped_at && (
                      <span style={{ color: '#6b6b6b' }}> ({new Date(order.shipped_at).toLocaleDateString('es-AR')})</span>
                    )}
                  </div>
                ) : (
                  <TrackingCodeForm orderId={order.id} />
                )}
              </div>
            )}

            {/* Acciones */}
            {order.status === 'pending' && (
              <div className="mt-4 flex items-center gap-4" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleConfirm(order.id)}
                  disabled={busyId === order.id}
                  className="pc-btn px-4 py-2 text-[13px] disabled:opacity-60"
                >
                  {busyId === order.id ? 'Confirmando...' : 'Marcar como vendido →'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(order.id)}
                  disabled={busyId === order.id}
                  className="text-[13px]"
                  style={{ color: '#6b6b6b' }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {order.payment_method === 'mercadopago' &&
              (order.status === 'confirmed' || (order.status === 'pending' && order.mp_status === 'approved')) && (
                <div className="mt-4 flex items-center gap-4" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => handleRefund(order.id)}
                    disabled={busyId === order.id}
                    className="text-[13px] disabled:opacity-60"
                    style={{ color: '#d81b8a' }}
                  >
                    {busyId === order.id ? 'Reembolsando...' : 'Reembolsar'}
                  </button>
                </div>
              )}
          </div>
        )
      })}

      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-[13px] disabled:opacity-40"
            style={{ border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
          >
            ← Anterior
          </button>
          <span className="text-[13px]" style={{ color: '#6b6b6b' }}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-[13px] disabled:opacity-40"
            style={{ border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
          >
            Siguiente →
          </button>
        </div>
      )}
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
    <form onSubmit={handleSubmit} className="p-3" style={{ backgroundColor: '#fef3e2' }}>
      <p className="text-[13px] font-medium" style={{ color: '#b45309' }}>
        Pagado — falta despachar
      </p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código de seguimiento"
          className="flex-1 px-3 py-2 text-[13px] outline-none"
          style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#111111' }}
        />
        <button
          type="submit"
          disabled={saving || !code.trim()}
          className="pc-btn px-4 py-2 text-[13px] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Marcar como enviado →'}
        </button>
      </div>
      <p className="mt-1 text-[11px]" style={{ color: '#b45309' }}>
        Le mandamos un email al cliente avisándole con este código.
      </p>
      {error && (
        <p className="mt-1 text-[12px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}
    </form>
  )
}
