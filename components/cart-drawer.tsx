'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart, buildWhatsAppLink, type CartItem } from '@/components/cart-context'
import { WhatsAppIcon } from '@/components/store/icons'
import { productImage } from '@/lib/products'
import { formatPrice } from '@/lib/format'
import { canPayOnline, storeName } from '@/lib/store-info'
import type { Store } from '@/lib/tenant'
import { createPendingOrder } from '@/app/[slug]/actions'

export function CartDrawer({ store }: { store: Store }) {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalCount } = useCart()
  const [sending, setSending] = useState(false)
  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  const online = canPayOnline(store)
  const canWhatsApp = store.whatsappOrdersEnabled && !!store.whatsappNumber

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, closeCart])

  async function orderByWhatsApp() {
    setSending(true)
    // Si falla el registro del pedido igual se abre WhatsApp: es el canal principal.
    await createPendingOrder(store.organizationId, store.branchId, items)
    window.open(buildWhatsAppLink(items, store.whatsappNumber ?? '', storeName(store)), '_blank', 'noreferrer')
    setSending(false)
  }

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={closeCart}
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        style={{ backgroundColor: 'rgba(15,15,15,.42)' }}
      />
      <aside
        role="dialog"
        aria-label="Carrito"
        aria-modal="true"
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white transition-transform duration-200 md:w-[440px] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ boxShadow: isOpen ? '-12px 0 40px rgba(0,0,0,.12)' : 'none' }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3.5 md:px-6 md:py-5" style={{ borderColor: 'var(--st-line2)' }}>
          <h2 className="text-[19px] font-bold">
            Tu carrito{' '}
            {totalCount > 0 && (
              <small className="text-[15px] font-medium" style={{ color: 'var(--st-mut)' }}>
                ({totalCount})
              </small>
            )}
          </h2>
          <button type="button" onClick={closeCart} aria-label="Cerrar carrito" className="grid h-9 w-9 place-items-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full" style={{ backgroundColor: 'var(--st-sf)' }}>
              <ShoppingBag className="h-6 w-6" />
            </span>
            <p className="font-semibold">Tu carrito está vacío</p>
            <Link href={`/${store.slug}/productos`} onClick={closeCart} className="st-btn st-btn-sm mt-1">
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-4 py-1 md:px-6">
              {items.map((item) => (
                <CartRow
                  key={item.key}
                  item={item}
                  slug={store.slug}
                  showPrices={store.showPrices}
                  onNavigate={closeCart}
                  onRemove={() => removeItem(item.key)}
                  onDec={() => updateQuantity(item.key, item.quantity - 1)}
                  onInc={() => updateQuantity(item.key, item.quantity + 1)}
                />
              ))}
            </ul>

            <div className="grid gap-2.5 border-t px-4 pb-[18px] pt-3.5 md:px-6 md:pb-[22px] md:pt-[18px]" style={{ borderColor: 'var(--st-line)' }}>
              <div className="flex justify-between text-[14px]" style={{ color: 'var(--st-mut)' }}>
                <span>Subtotal</span>
                <span className="font-semibold" style={{ color: 'var(--st-ink)' }}>
                  {store.showPrices ? formatPrice(subtotal) : 'A confirmar'}
                </span>
              </div>
              {online && store.shippingEnabled && (
                <div className="flex justify-between text-[14px]" style={{ color: 'var(--st-mut)' }}>
                  <span>Envío</span>
                  <span>Se calcula al finalizar</span>
                </div>
              )}
              {online && (
                <Link href={`/${store.slug}/checkout`} onClick={closeCart} className="st-btn st-btn-pri st-btn-lg w-full">
                  Finalizar compra
                  <ArrowRight />
                </Link>
              )}
              {canWhatsApp && (
                <button type="button" onClick={orderByWhatsApp} disabled={sending} className={`st-btn st-btn-wa w-full ${online ? '' : 'st-btn-lg'}`}>
                  <WhatsAppIcon />
                  {sending ? 'Abriendo WhatsApp…' : 'Pedir por WhatsApp'}
                </button>
              )}
              {!online && canWhatsApp && (
                <p className="text-center text-[12px]" style={{ color: 'var(--st-mut)' }}>
                  Te contactamos para confirmar el pedido, el pago y la entrega.
                </p>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  )
}

function CartRow({
  item,
  slug,
  showPrices,
  onNavigate,
  onRemove,
  onDec,
  onInc,
}: {
  item: CartItem
  slug: string
  showPrices: boolean
  onNavigate: () => void
  onRemove: () => void
  onDec: () => void
  onInc: () => void
}) {
  const href = `/${slug}/productos/${item.product.id}`
  return (
    <li className="grid grid-cols-[76px_1fr_auto] gap-3.5 border-b py-4" style={{ borderColor: 'var(--st-line2)' }}>
      <Link href={href} onClick={onNavigate} className="h-[94px] w-[76px] overflow-hidden rounded-xl" style={{ backgroundColor: 'var(--st-sf)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={productImage(item.product)} alt={item.product.name} className="h-full w-full object-cover" />
      </Link>
      <div className="min-w-0">
        <Link href={href} onClick={onNavigate} className="block text-[15px] font-medium leading-[1.3]">
          {item.product.name}
        </Link>
        {item.size && (
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--st-mut)' }}>
            Talle {item.size}
          </p>
        )}
        <div className="mt-2.5 inline-flex h-[34px] items-center rounded-full border px-1" style={{ borderColor: 'var(--st-line)' }}>
          <button type="button" onClick={onDec} disabled={item.quantity <= 1} aria-label="Uno menos" className="grid h-7 w-7 place-items-center">
            <Minus className="h-[15px] w-[15px]" />
          </button>
          <span className="w-[22px] text-center text-[14px] font-semibold">{item.quantity}</span>
          <button type="button" onClick={onInc} aria-label="Uno más" className="grid h-7 w-7 place-items-center">
            <Plus className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <b className="text-[15px]">{showPrices && item.product.price != null ? formatPrice(item.product.price * item.quantity) : ''}</b>
        <button type="button" onClick={onRemove} aria-label={`Quitar ${item.product.name}`} className="grid h-8 w-8 place-items-center" style={{ color: 'var(--st-soft)' }}>
          <Trash2 className="h-[17px] w-[17px]" />
        </button>
      </div>
    </li>
  )
}
