'use client'

import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/products'

export function ProductsClient({
  products,
  slug,
}: {
  products: Product[]
  slug: string
}) {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set())
  const [activeSizes, setActiveSizes] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState<'default' | 'name-asc' | 'name-desc'>('default')

  // Categorías/medidas se derivan de los productos ya traídos (store_catalog es lo único
  // público — no hay una policy pública separada para las tablas categories/sizes, ver Fase 04).
  const categories = useMemo(() => {
    const names = new Set(products.map((p) => p.category).filter(Boolean))
    return Array.from(names).sort()
  }, [products])

  const sizes = useMemo(() => {
    const all = new Set<string>()
    products.forEach((p) => p.sizes?.forEach((s) => all.add(s)))
    return Array.from(all).sort()
  }, [products])

  function toggleCategory(cat: string) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function toggleSize(size: string) {
    setActiveSizes((prev) => {
      const next = new Set(prev)
      if (next.has(size)) next.delete(size)
      else next.add(size)
      return next
    })
  }

  const filtered = products
    .filter((p) => {
      const categoryMatch = activeCategories.size === 0 || activeCategories.has(p.category)
      const sizeMatch = activeSizes.size === 0 || p.sizes?.some((s) => activeSizes.has(s))
      return categoryMatch && sizeMatch
    })
    .sort((a, b) => {
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name)
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name)
      return 0
    })

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[32px] font-medium" style={{ color: '#111111' }}>
            Productos
          </h1>
          <span className="text-[15px]" style={{ color: '#6b6b6b' }}>
            {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
          className="px-3 py-2 text-[12px] uppercase"
          style={{ letterSpacing: '0.04em', border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
        >
          <option value="default">Orden por defecto</option>
          <option value="name-asc">Nombre A-Z</option>
          <option value="name-desc">Nombre Z-A</option>
        </select>
      </div>

      {/* Filtro categorías */}
      <div
        className="mt-8 flex flex-wrap gap-x-7 gap-y-3 pb-6"
        style={{ borderBottom: '1px solid #e5e5e5' }}
      >
        <button
          type="button"
          onClick={() => setActiveCategories(new Set())}
          className="text-[13px] uppercase"
          style={{
            letterSpacing: '0.06em',
            color: activeCategories.size === 0 ? '#111111' : '#6b6b6b',
            paddingBottom: '4px',
            borderBottom: activeCategories.size === 0 ? '1px solid var(--color-accent)' : '1px solid transparent',
          }}
        >
          Todos
        </button>
        {categories.map((cat) => {
          const isActive = activeCategories.has(cat)
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className="text-[13px] uppercase"
              style={{
                letterSpacing: '0.06em',
                color: isActive ? '#111111' : '#6b6b6b',
                paddingBottom: '4px',
                borderBottom: isActive ? '1px solid var(--color-accent)' : '1px solid transparent',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Filtro medidas */}
      {sizes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSizes(new Set())}
            className="px-3 py-1.5 text-[12px] uppercase"
            style={{
              letterSpacing: '0.04em',
              border: `1px solid ${activeSizes.size === 0 ? '#111111' : '#e5e5e5'}`,
              backgroundColor: activeSizes.size === 0 ? '#111111' : '#fff',
              color: activeSizes.size === 0 ? '#fff' : '#6b6b6b',
            }}
          >
            Todas
          </button>
          {sizes.map((size) => {
            const isActive = activeSizes.has(size)
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className="px-3 py-1.5 text-[12px] uppercase"
                style={{
                  letterSpacing: '0.04em',
                  border: `1px solid ${isActive ? '#111111' : '#e5e5e5'}`,
                  backgroundColor: isActive ? '#111111' : '#fff',
                  color: isActive ? '#fff' : '#6b6b6b',
                }}
              >
                {size}
              </button>
            )
          })}
        </div>
      )}

      {/* Grid */}
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-3 py-10 text-[14px]" style={{ color: '#6b6b6b' }}>
            No hay productos con ese filtro.
          </p>
        ) : (
          filtered.map((product) => (
            <ProductCard key={product.id} product={product} slug={slug} />
          ))
        )}
      </div>
    </>
  )
}
