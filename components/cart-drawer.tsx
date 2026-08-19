'use client'

import { useState } from 'react'
import { X, Minus, Plus } from 'lucide-react'
import {
  useCart,
  buildWhatsAppLink,
  type CartItem,
} from '@/components/cart-context'
import { productImage } from '@/lib/products'
import type { Store } from '@/lib/tenant'
import { createPendingOrder } from '@/app/[slug]/actions'

export function CartDrawer({ store }: { store: Store }) {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCart()
  const brandName = store.storeName ?? store.organizationName
  const [sending, setSending] = useState(false)

  async function handleCheckout() {
    setSending(true)
    // Si falla la creación del pedido rastreado, igual dejamos pasar a WhatsApp — ver
    // createPendingOrder: el canal principal (WhatsApp) no debe depender de esto.
    await createPendingOrder(store.organizationId, store.branchId, items)
    window.open(buildWhatsAppLink(items, store.whatsappNumber ?? '', brandName), '_blank', 'noreferrer')
    setSending(false)
  }

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={closeCart}
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ backgroundColor: 'rgba(17,17,17,0.25)' }}
      />
      <aside
        role="dialog"
        aria-label="Carrito"
        aria-modal="true"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e5e5e5',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #e5e5e5' }}
        >
          <h2 className="text-[18px] font-medium" style={{ color: '#111111' }}>
            Carrito
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            style={{ color: '#111111' }}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6">
              <p className="text-[14px]" style={{ color: '#6b6b6b' }}>
                Tu carrito está vacío
              </p>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <CartRow
                  key={item.key}
                  item={item}
                  onRemove={() => removeItem(item.key)}
                  onDec={() => updateQuantity(item.key, item.quantity - 1)}
                  onInc={() => updateQuantity(item.key, item.quantity + 1)}
                />
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div
            className="px-6 py-5"
            style={{ borderTop: '1px solid #e5e5e5' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[14px]" style={{ color: '#6b6b6b' }}>
                Subtotal
              </span>
              <span
                className="text-[14px] font-medium"
                style={{ color: '#111111' }}
              >
                A confirmar
              </span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={sending}
              className="pc-btn w-full px-4 py-3 text-[14px] disabled:opacity-60"
            >
              {sending ? 'Enviando pedido...' : 'Consultar por WhatsApp →'}
            </button>
            <p className="mt-3 text-[12px]" style={{ color: '#6b6b6b' }}>
              Nos contactamos para confirmar tu pedido y acordar el diseño.
            </p>
          </div>
        )}
      </aside>
    </>
  )
}

function CartRow({
  item,
  onRemove,
  onDec,
  onInc,
}: {
  item: CartItem
  onRemove: () => void
  onDec: () => void
  onInc: () => void
}) {
  return (
    <li
      className="flex gap-4 px-6 py-5"
      style={{ borderBottom: '1px solid #e5e5e5' }}
    >
      <div
        className="h-16 w-16 flex-shrink-0 overflow-hidden"
        style={{ backgroundColor: '#f5f5f3' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={productImage(item.product) || '/placeholder.jpg'}
          alt={item.product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[15px] font-medium leading-snug"
            style={{ color: '#111111' }}
          >
            {item.product.name}
          </p>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Quitar"
            className="text-[13px] leading-none"
            style={{ color: '#6b6b6b' }}
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-[13px]" style={{ color: '#6b6b6b' }}>
          {item.product.category}{item.size ? ` · ${item.size}` : ''}
        </p>
        <div className="mt-3 inline-flex w-fit items-center">
          <button
            type="button"
            onClick={onDec}
            aria-label="Disminuir"
            className="flex h-8 w-8 items-center justify-center"
            style={{ border: '1px solid #e5e5e5', color: '#111111' }}
          >
            <Minus size={13} strokeWidth={1.5} />
          </button>
          <span
            className="flex h-8 w-10 items-center justify-center text-[14px]"
            style={{
              borderTop: '1px solid #e5e5e5',
              borderBottom: '1px solid #e5e5e5',
              color: '#111111',
            }}
          >
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={onInc}
            aria-label="Aumentar"
            className="flex h-8 w-8 items-center justify-center"
            style={{ border: '1px solid #e5e5e5', color: '#111111' }}
          >
            <Plus size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </li>
  )
}
