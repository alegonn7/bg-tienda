'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useCart } from '@/components/cart-context'
import type { Product } from '@/lib/products'
import { LOW_STOCK, hasDiscount, isNewProduct, productImage } from '@/lib/products'
import { formatPrice } from '@/lib/format'

export function sizeRange(sizes: string[]): string {
  if (sizes.length === 0) return ''
  if (sizes.length === 1) return sizes[0]
  return `${sizes[0]} a ${sizes[sizes.length - 1]}`
}

export function ProductBadge({ product, className = '' }: { product: Product; className?: string }) {
  const off = hasDiscount(product) ? Math.round((1 - product.price! / product.compareAtPrice!) * 100) : 0
  const base = `rounded-full px-2 py-1 text-[11px] font-semibold md:px-2.5 md:text-[12px] ${className}`
  if (product.stock != null && product.stock > 0 && product.stock <= LOW_STOCK)
    return (
      <span className={base} style={{ backgroundColor: 'var(--st-warn-soft)', color: 'var(--st-warn)' }}>
        {product.stock === 1 ? 'Última unidad' : `Últimas ${product.stock}`}
      </span>
    )
  if (off >= 5)
    return (
      <span className={base} style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
        -{off}%
      </span>
    )
  if (isNewProduct(product))
    return (
      <span className={base} style={{ backgroundColor: 'var(--st-ink)', color: '#fff' }}>
        Nuevo
      </span>
    )
  return null
}

export function ProductCard({ product, slug, showPrices = false }: { product: Product; slug: string; showPrices?: boolean }) {
  const { addItem } = useCart()
  const href = `/${slug}/productos/${product.id}`
  const hasSizes = product.sizes.length > 0
  const priced = showPrices && product.price != null

  return (
    <div className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl md:rounded-2xl" style={{ backgroundColor: 'var(--st-sf)' }}>
        <Link href={href} aria-label={`Ver ${product.name}`} className="block h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productImage(product)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="pointer-events-none absolute left-2 top-2 md:left-3 md:top-3">
          <ProductBadge product={product} />
        </div>
        {/* Sin talles se agrega directo; con talles hay que elegir uno, así que lleva al producto. */}
        {hasSizes ? (
          <Link
            href={href}
            aria-label={`Elegir talle de ${product.name}`}
            className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-white md:bottom-3 md:right-3 md:h-[42px] md:w-[42px]"
            style={{ boxShadow: '0 4px 14px rgba(0,0,0,.12)' }}
          >
            <Plus className="h-[18px] w-[18px] md:h-5 md:w-5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => addItem(product, 1)}
            aria-label={`Agregar ${product.name} al carrito`}
            className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-white md:bottom-3 md:right-3 md:h-[42px] md:w-[42px]"
            style={{ boxShadow: '0 4px 14px rgba(0,0,0,.12)' }}
          >
            <Plus className="h-[18px] w-[18px] md:h-5 md:w-5" />
          </button>
        )}
      </div>
      <Link href={href} className="block">
        <p className="mt-2.5 text-[14px] font-medium leading-[1.3] md:mt-3 md:text-[15px]">{product.name}</p>
        <div className="mt-1 flex flex-col gap-px md:flex-row md:items-baseline md:justify-between md:gap-2">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className={priced ? 'text-[15px] font-bold md:text-[16px]' : 'text-[14px]'} style={priced ? undefined : { color: 'var(--st-mut)' }}>
              {priced ? formatPrice(product.price) : 'Consultá precio'}
            </span>
            {priced && hasDiscount(product) && (
              <span className="text-[13px] line-through" style={{ color: 'var(--st-soft)' }}>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </span>
          {hasSizes && (
            <span className="text-[12px] md:text-[13px]" style={{ color: 'var(--st-mut)' }}>
              {sizeRange(product.sizes)}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
