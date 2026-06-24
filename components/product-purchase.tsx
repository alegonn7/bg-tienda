'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useCart, buildWhatsAppLink } from '@/components/cart-context'
import type { Product } from '@/lib/products'

export function ProductPurchase({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [size, setSize] = useState<string | undefined>(
    product.sizes?.length === 1 ? product.sizes[0] : undefined,
  )

  return (
    <div>
      {/* Size selector */}
      {product.sizes && product.sizes.length > 1 && (
        <div className="mb-6">
          <p className="mb-3 text-[13px] uppercase" style={{ letterSpacing: '0.02em', color: '#6b6b6b' }}>
            Medida
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className="px-4 py-2 text-[13px]"
                style={{
                  border: `1px solid ${size === s ? '#111111' : '#e5e5e5'}`,
                  backgroundColor: size === s ? '#111111' : '#ffffff',
                  color: size === s ? '#ffffff' : '#111111',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity selector */}
      <div className="mb-6">
        <p
          className="mb-3 text-[13px] uppercase"
          style={{ letterSpacing: '0.02em', color: '#6b6b6b' }}
        >
          Cantidad
        </p>
        <div className="inline-flex items-center">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Disminuir"
            className="flex h-11 w-11 items-center justify-center"
            style={{ border: '1px solid #111111', color: '#111111' }}
          >
            <Minus size={15} strokeWidth={1.5} />
          </button>
          <span
            className="flex h-11 w-14 items-center justify-center text-[15px]"
            style={{
              borderTop: '1px solid #111111',
              borderBottom: '1px solid #111111',
              color: '#111111',
            }}
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Aumentar"
            className="flex h-11 w-11 items-center justify-center"
            style={{ border: '1px solid #111111', color: '#111111' }}
          >
            <Plus size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => addItem(product, qty, size)}
        className="pc-btn w-full px-6 py-3.5 text-[14px]"
      >
        Agregar al carrito
      </button>

      <a
        href={buildWhatsAppLink([{ key: `${product.id}::${size ?? ''}`, product, size, quantity: qty }])}
        target="_blank"
        rel="noreferrer"
        className="detail-link mt-5 inline-flex items-center gap-2 text-[13px]"
        style={{ color: '#6b6b6b' }}
      >
        <WhatsAppIcon />
        Consultar por WhatsApp
      </a>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.25 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
    </svg>
  )
}
