'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/products'

// Fila horizontal de productos: 4 por pantalla en la compu (con flechas), casi 2 en el celular
// (se desliza con el dedo).
export function FeaturedCarousel({
  title,
  subtitle,
  products,
  slug,
  showPrices = false,
}: {
  title: string
  subtitle?: string
  products: Product[]
  slug: string
  showPrices?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  function scroll(dir: 1 | -1) {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.offsetWidth * 0.9, behavior: 'smooth' })
  }

  if (products.length === 0) return null

  return (
    <section className="st-wrap pt-10 md:pt-16">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-[22px]">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[28px]">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-[14px] md:text-[15px]" style={{ color: 'var(--st-mut)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {products.length > 4 && (
          <div className="hidden gap-2 md:flex">
            <button type="button" onClick={() => scroll(-1)} aria-label="Anteriores" className="grid h-10 w-10 place-items-center rounded-full border" style={{ borderColor: 'var(--st-line)' }}>
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="Siguientes" className="grid h-10 w-10 place-items-center rounded-full border" style={{ borderColor: 'var(--st-line)' }}>
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={ref}
        className="st-noscroll -mr-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pr-4 md:mr-0 md:gap-5 md:pr-0"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[46%] flex-shrink-0 snap-start md:w-[calc((100%-60px)/4)]">
            <ProductCard product={p} slug={slug} showPrices={showPrices} />
          </div>
        ))}
      </div>
    </section>
  )
}
