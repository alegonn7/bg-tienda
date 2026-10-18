'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { ProductBadge } from '@/components/product-card'
import type { Product } from '@/lib/products'

// Fotos del producto: en la compu, miniaturas al costado; en el celular se deslizan con el dedo.
// Tocando la foto se ve en grande.
export function ProductGallery({ product }: { product: Product }) {
  const images = product.images.length ? product.images : ['/placeholder.jpg']
  const [current, setCurrent] = useState(0)
  const [zoom, setZoom] = useState(false)
  const strip = useRef<HTMLDivElement>(null)

  function onScroll() {
    const el = strip.current
    if (el) setCurrent(Math.round(el.scrollLeft / el.offsetWidth))
  }

  function go(i: number) {
    const n = (i + images.length) % images.length
    setCurrent(n)
    strip.current?.scrollTo({ left: n * strip.current.offsetWidth })
  }

  useEffect(() => {
    if (!zoom) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false)
      if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % images.length)
      if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [zoom, images.length])

  return (
    <div>
      <div className={`-mx-4 md:mx-0 md:grid md:gap-3.5 ${images.length > 1 ? 'md:grid-cols-[84px_1fr]' : ''}`}>
        {images.length > 1 && (
          <div className="hidden content-start gap-2.5 md:grid">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ver foto ${i + 1}`}
                className="aspect-[4/5] overflow-hidden rounded-xl border-2"
                style={{ borderColor: i === current ? 'var(--st-ink)' : 'transparent', backgroundColor: 'var(--st-sf)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="relative overflow-hidden md:rounded-[20px]" style={{ backgroundColor: 'var(--st-sf)' }}>
          <div ref={strip} onScroll={onScroll} className="st-noscroll flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto md:overflow-hidden">
            {images.map((src, i) => (
              <button key={src + i} type="button" onClick={() => setZoom(true)} className="h-full w-full flex-shrink-0 snap-center" aria-label="Ver foto en grande">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={i === 0 ? product.name : ''} className="h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute left-3.5 top-3.5">
            <ProductBadge product={product} />
          </div>
          <button type="button" onClick={() => setZoom(true)} aria-label="Ver foto en grande" className="absolute right-3.5 top-3.5 grid h-10 w-10 place-items-center rounded-full bg-white">
            <Maximize2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5 md:hidden">
          {images.map((src, i) => (
            <span key={src + i} className="h-1.5 rounded transition-all" style={{ width: i === current ? 18 : 6, backgroundColor: i === current ? 'var(--st-ink)' : 'var(--st-line)' }} />
          ))}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[current]} alt={product.name} className="max-h-[92vh] max-w-[94vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={() => setZoom(false)} aria-label="Cerrar" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(current - 1) }} aria-label="Foto anterior" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(current + 1) }} aria-label="Foto siguiente" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
