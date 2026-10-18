'use client'

import { useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useCart, buildWhatsAppLink, type CartItem } from '@/components/cart-context'
import { WhatsAppIcon } from '@/components/store/icons'
import { LOW_STOCK, type Product } from '@/lib/products'
import { formatPrice } from '@/lib/format'
import { storeName } from '@/lib/store-info'
import type { Store } from '@/lib/tenant'
import { createPendingOrder } from '@/app/[slug]/actions'

// Talle (uno a la vez), cantidad y los botones de compra. En el celular, "Agregar al carrito"
// queda fijo abajo de la pantalla.
export function ProductPurchase({ product, store }: { product: Product; store: Store }) {
  const { addItem } = useCart()
  const hasSizes = product.sizes.length > 0
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null)
  const [qty, setQty] = useState(1)
  const [needSize, setNeedSize] = useState(false)
  const [sending, setSending] = useState(false)
  const sizesRef = useRef<HTMLDivElement>(null)
  const maxQty = product.stock != null && product.stock > 0 ? product.stock : 99
  const canWhatsApp = store.whatsappOrdersEnabled && !!store.whatsappNumber
  const priced = store.showPrices && product.price != null

  function requireSize(): boolean {
    if (hasSizes && !size) {
      setNeedSize(true)
      sizesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  function add() {
    if (!requireSize()) return
    addItem(product, qty, size ?? undefined)
  }

  async function consult() {
    if (!requireSize()) return
    const items: CartItem[] = [{ key: `${product.id}::${size ?? ''}`, product, size: size ?? undefined, quantity: qty }]
    setSending(true)
    // Si falla el registro del pedido igual se abre WhatsApp: es el canal principal.
    await createPendingOrder(store.organizationId, store.branchId, items)
    window.open(buildWhatsAppLink(items, store.whatsappNumber ?? '', storeName(store)), '_blank', 'noreferrer')
    setSending(false)
  }

  return (
    <>
      {hasSizes && (
        <div ref={sizesRef} className="mt-5 md:mt-6">
          <p className="mb-2.5 text-[14px]">
            Talle: <b className="font-semibold">{size ?? '—'}</b>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                onClick={() => {
                  setSize(s)
                  setNeedSize(false)
                }}
                className="st-chip !h-[46px] !min-w-[58px] !rounded-xl !text-[15px]"
              >
                {s}
              </button>
            ))}
          </div>
          {needSize && (
            <p className="mt-2 text-[13px] font-medium" style={{ color: 'var(--st-bad)' }}>
              Elegí un talle para seguir.
            </p>
          )}
        </div>
      )}
      {product.stock != null && product.stock > 0 && product.stock <= LOW_STOCK && (
        <p className="mt-2.5 inline-flex items-center gap-2 text-[13px]" style={{ color: 'var(--st-warn)' }}>
          <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: 'var(--st-warn)' }} />
          {product.stock === 1 ? '¡Queda solo 1!' : `Quedan solo ${product.stock}`}
        </p>
      )}

      {/* Compu */}
      <div className="mt-6 hidden gap-2.5 md:flex">
        <div className="flex h-[54px] items-center rounded-full border-[1.5px] px-1.5" style={{ borderColor: 'var(--st-line)' }}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Uno menos" className="grid h-10 w-10 place-items-center" disabled={qty <= 1}>
            <Minus className="h-[18px] w-[18px]" />
          </button>
          <span className="w-8 text-center font-semibold">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Uno más" className="grid h-10 w-10 place-items-center" disabled={qty >= maxQty}>
            <Plus className="h-[18px] w-[18px]" />
          </button>
        </div>
        <button type="button" onClick={add} className="st-btn st-btn-pri st-btn-lg flex-1">
          Agregar al carrito
        </button>
      </div>
      {canWhatsApp && (
        <button type="button" onClick={consult} disabled={sending} className="st-btn st-btn-wa st-btn-lg mt-2.5 hidden w-full md:flex">
          <WhatsAppIcon />
          {sending ? 'Abriendo WhatsApp…' : 'Consultar por WhatsApp'}
        </button>
      )}

      {/* Celular: barra fija abajo */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2.5 border-t bg-white px-4 pb-3.5 pt-2.5 md:hidden" style={{ borderColor: 'var(--st-line)' }}>
        <div className="min-w-0 leading-tight">
          <p className={priced ? 'text-[17px] font-bold' : 'text-[14px] font-semibold'}>{priced ? formatPrice(product.price) : 'Consultá precio'}</p>
          {size && <p className="text-[12px]" style={{ color: 'var(--st-mut)' }}>Talle {size}</p>}
        </div>
        {canWhatsApp && (
          <button type="button" onClick={consult} disabled={sending} aria-label="Consultar por WhatsApp" className="ml-auto grid h-[50px] w-[50px] flex-shrink-0 place-items-center rounded-full border-[1.5px]" style={{ borderColor: 'var(--st-wa)', color: 'var(--st-wa)' }}>
            <WhatsAppIcon size={22} />
          </button>
        )}
        <button type="button" onClick={add} className={`st-btn st-btn-pri !h-[50px] flex-1 ${canWhatsApp ? '' : 'ml-auto'}`}>
          Agregar al carrito
        </button>
      </div>
    </>
  )
}
