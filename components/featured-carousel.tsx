'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/products'

export function FeaturedCarousel({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!ref.current) return
    const amount = ref.current.offsetWidth * 0.8
    ref.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  if (products.length === 0) return null

  return (
    <div className="relative">
      {products.length > 3 && (
        <>
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute -left-5 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#111111' }}
            aria-label="Anterior"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute -right-5 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#111111' }}
            aria-label="Siguiente"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </>
      )}

      <div
        ref={ref}
        className="flex gap-6 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="w-[300px] flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
