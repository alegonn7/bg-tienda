'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Minus, Plus } from 'lucide-react'
import {
  useCart,
  buildWhatsAppLink,
  type CartItem,
} from '@/components/cart-context'
import { productImage } from '@/lib/products'
import type { Store } from '@/lib/tenant'
import { createPendingOrder, createMercadoPagoCheckout } from '@/app/[slug]/actions'
import { formatPrice } from '@/lib/format'

export function CartDrawer({ store }: { store: Store }) {
  const router = useRouter()
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCart()
  const brandName = store.storeName ?? store.organizationName
  const [sending, setSending] = useState(false)
  const [mpSending, setMpSending] = useState(false)
  const [mpError, setMpError] = useState('')
  const [mpEmail, setMpEmail] = useState('')
  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)

  async function handleCheckout() {
    setSending(true)
    // Si falla la creación del pedido rastreado, igual dejamos pasar a WhatsApp — ver
    // createPendingOrder: el canal principal (WhatsApp) no debe depender de esto.
    await createPendingOrder(store.organizationId, store.branchId, items)
    window.open(buildWhatsAppLink(items, store.whatsappNumber ?? '', brandName), '_blank', 'noreferrer')
    setSending(false)
  }

  // Si la tienda activó envío calculado, hace falta pedir dirección — eso vive en su propia
  // página (/[slug]/checkout), no en este drawer angosto. Si NO lo activó, el botón sigue
  // funcionando exactamente igual que antes de que existiera el módulo de envíos: pago directo
  // sin pedir nada más, sin ningún cambio de comportamiento para esas tiendas.
  function handleMercadoPagoCheckout() {
    if (store.shippingEnabled) {
      router.push(`/${store.slug}/checkout`)
      return
    }
    payWithMercadoPago()
  }

  // A diferencia de WhatsApp, si esto falla no hay canal de respaldo — el error se muestra
  // inline. window.location.href (no window.open) porque es una navegación real a pagar.
  async function payWithMercadoPago() {
    setMpSending(true)
    setMpError('')
    try {
      const { checkoutUrl } = await createMercadoPagoCheckout(
        store.organizationId,
        store.branchId,
        store.slug,
        items.map((item) => ({ productId: item.product.id, size: item.size, quantity: item.quantity })),
        { method: 'pickup', customerEmail: mpEmail },
      )
      window.location.href = checkoutUrl
    } catch (err) {
      setMpError(err instanceof Error ? err.message : 'No se pudo iniciar el pago')
      setMpSending(false)
    }
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
                  showPrices={store.showPrices}
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
                {store.showPrices ? formatPrice(subtotal) : 'A confirmar'}
              </span>
            </div>
            {store.whatsappOrdersEnabled && (
              <>
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
              </>
            )}
            {store.mercadopagoAvailable && (
              <>
                {/* Solo acá: si la tienda tiene envío activado, handleMercadoPagoCheckout manda
                    a /checkout, que ya tiene su propio campo de email en el formulario completo. */}
                {!store.shippingEnabled && (
                  <input
                    type="email"
                    value={mpEmail}
                    onChange={(e) => setMpEmail(e.target.value)}
                    placeholder="Tu email (para mandarte el comprobante)"
                    required
                    className="mt-3 w-full px-4 py-3 text-[14px] outline-none"
                    style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#111111' }}
                  />
                )}
                <button
                  type="button"
                  onClick={handleMercadoPagoCheckout}
                  disabled={mpSending || (!store.shippingEnabled && !mpEmail)}
                  className="mt-3 w-full px-4 py-3 text-[14px] disabled:opacity-60"
                  style={{ border: '1px solid #111111', color: '#111111', backgroundColor: '#fff' }}
                >
                  {mpSending ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago →'}
                </button>
                {mpError && (
                  <p className="mt-2 text-[12px]" style={{ color: '#d81b8a' }}>
                    {mpError}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </aside>
    </>
  )
}

function CartRow({
  item,
  showPrices,
  onRemove,
  onDec,
  onInc,
}: {
  item: CartItem
  showPrices: boolean
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
          {showPrices && item.product.price != null ? ` · ${formatPrice(item.product.price)}` : ''}
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
