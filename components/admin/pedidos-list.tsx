'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmOrder, cancelOrder } from '@/app/admin/actions'

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
  store_order_items: OrderItem[]
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  pending: { text: 'Pendiente', color: '#b45309' },
  confirmed: { text: 'Confirmado', color: '#16a34a' },
  cancelled: { text: 'Cancelado', color: '#6b6b6b' },
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
