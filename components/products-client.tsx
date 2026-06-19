'use client'

import { useState } from 'react'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/products'

export function ProductsClient({
  products,
  categories,
  sizes,
}: {
  products: Product[]
  categories: string[]
  sizes: string[]
}) {
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [activeSize, setActiveSize] = useState('')

  const filtered = products.filter((p) => {
    const categoryMatch = activeCategory === 'Todos' || p.category === activeCategory
    const sizeMatch = !activeSize || p.sizes?.includes(activeSize)
    return categoryMatch && sizeMatch
  })

  return (
    <>
      <div className="flex items-baseline gap-3">
        <h1 className="text-[32px] font-medium" style={{ color: '#111111' }}>
          Productos
        </h1>
        <span className="text-[15px]" style={{ color: '#6b6b6b' }}>
          {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {/* Filtro categorías */}
      <div
        className="mt-8 flex flex-wrap gap-x-7 gap-y-3 pb-6"
        style={{ borderBottom: '1px solid #e5e5e5' }}
      >
        {categories.map((cat) => {
          const isActive = cat === activeCategory
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="text-[13px] uppercase"
              style={{
                letterSpacing: '0.06em',
                color: isActive ? '#111111' : '#6b6b6b',
                paddingBottom: '4px',
                borderBottom: isActive ? '1px solid #d81b8a' : '1px solid transparent',
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
            onClick={() => setActiveSize('')}
            className="px-3 py-1.5 text-[12px] uppercase"
            style={{
              letterSpacing: '0.04em',
              border: `1px solid ${!activeSize ? '#111111' : '#e5e5e5'}`,
              backgroundColor: !activeSize ? '#111111' : '#fff',
              color: !activeSize ? '#fff' : '#6b6b6b',
            }}
          >
            Todas
          </button>
          {sizes.map((size) => {
            const isActive = activeSize === size
            return (
              <button
                key={size}
                type="button"
                onClick={() => setActiveSize(isActive ? '' : size)}
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
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </>
  )
}
