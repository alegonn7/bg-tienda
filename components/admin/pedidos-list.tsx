'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmOrder, cancelOrder, refundOrder } from '@/app/admin/actions'

const PAGE_SIZE = 10

type OrderItem = {
  id: string
  product_name: string
  size: string | null
  quantity: number
}

type Order = {
  id: string
  status: string
  created_at: string
  payment_method: string
  mp_status: string | null
  delivery_method: string | null
  shipping_carrier: string | null
  shipping_cost: number | null
  shipping_street: string | null
  shipping_number: string | null
  shipping_floor_apartment: string | null
  shipping_city: string | null
  shipping_province: string | null
  shipping_postal_code: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_note: string | null
  store_order_items: OrderItem[]
}

const CARRIER_LABEL: Record<string, string> = {
  correo_argentino: 'Correo Argentino',
  andreani: 'Andreani',
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  pending: { text: 'Pendiente', color: '#b45309' },
  confirmed: { text: 'Confirmado', color: '#16a34a' },
  cancelled: { text: 'Cancelado', color: '#6b6b6b' },
  refunded: { text: 'Reembolsado', color: '#6b6b6b' },
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
        const info = STATUS_LABEL[order.status] ?? { text: order.status, color: '#6b6b6b' }
        return (
          <div key={order.id} className="p-5" style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff' }}>
            <div className="flex items-center justify-between">
              <span
                className="text-[12px] font-medium uppercase"
                style={{ letterSpacing: '0.04em', color: info.color }}
              >
                {info.text}
              </span>
              <span className="text-[12px]" style={{ color: '#6b6b6b' }}>
                {new Date(order.created_at).toLocaleString('es-AR')}
              </span>
            </div>

            <ul className="mt-3 flex flex-col gap-1">
              {order.store_order_items.map((item) => (
                <li key={item.id} className="text-[14px]" style={{ color: '#111111' }}>
                  {item.quantity}× {item.product_name}
                  {item.size ? ` — ${item.size}` : ''}
                </li>
              ))}
            </ul>

            {(order.customer_name || order.delivery_method === 'shipping') && (
              <div className="mt-3 text-[13px]" style={{ color: '#111111' }}>
                {order.customer_name && (
                  <p>
                    {order.customer_name}
                    {order.customer_phone ? ` — ${order.customer_phone}` : ''}
                  </p>
                )}
                {order.delivery_method === 'shipping' ? (
                  <p style={{ color: '#6b6b6b' }}>
                    Envío por {CARRIER_LABEL[order.shipping_carrier ?? ''] ?? order.shipping_carrier}
                    {order.shipping_cost != null ? ` (${order.shipping_cost})` : ''} a{' '}
                    {order.shipping_street} {order.shipping_number}
                    {order.shipping_floor_apartment ? `, ${order.shipping_floor_apartment}` : ''},{' '}
                    {order.shipping_city}, {order.shipping_province} (CP {order.shipping_postal_code})
                  </p>
                ) : (
                  order.customer_name && <p style={{ color: '#6b6b6b' }}>Retira en el local</p>
                )}
                {order.customer_note && <p style={{ color: '#6b6b6b' }}>Nota: {order.customer_note}</p>}
              </div>
            )}

            {order.payment_method === 'mercadopago' && order.status === 'pending' && order.mp_status === 'approved' && (
              <p className="mt-3 text-[12px] font-medium" style={{ color: '#dc2626' }}>
                Pagado — sin stock, revisar
              </p>
            )}

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
