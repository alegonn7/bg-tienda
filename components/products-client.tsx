'use client'

import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { FilterDropdown } from '@/components/filter-dropdown'
import type { Product } from '@/lib/products'

const PAGE_SIZE = 24

type SortOrder = 'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

export function ProductsClient({
  products,
  slug,
  showPrices = false,
}: {
  products: Product[]
  slug: string
  showPrices?: boolean
}) {
  const [search, setSearch] = useState('')
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set())
  const [activeSizes, setActiveSizes] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')
  const [page, setPage] = useState(1)

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

  function updateFilter(fn: () => void) {
    fn()
    setPage(1)
  }

  function toggleCategory(cat: string) {
    updateFilter(() =>
      setActiveCategories((prev) => {
        const next = new Set(prev)
        if (next.has(cat)) next.delete(cat)
        else next.add(cat)
        return next
      })
    )
  }

  function toggleSize(size: string) {
    updateFilter(() =>
      setActiveSizes((prev) => {
        const next = new Set(prev)
        if (next.has(size)) next.delete(size)
        else next.add(size)
        return next
      })
    )
  }

  const sorted = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = products.filter((p) => {
      const searchMatch = !term || p.name.toLowerCase().includes(term)
      const categoryMatch = activeCategories.size === 0 || activeCategories.has(p.category)
      const sizeMatch = activeSizes.size === 0 || p.sizes?.some((s) => activeSizes.has(s))
      return searchMatch && categoryMatch && sizeMatch
    })

    switch (sortOrder) {
      case 'name-asc':
        return filtered.sort((a, b) => a.name.localeCompare(b.name))
      case 'name-desc':
        return filtered.sort((a, b) => b.name.localeCompare(a.name))
      case 'price-asc':
        return filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      case 'price-desc':
        return filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      default:
        return filtered
    }
  }, [products, search, activeCategories, activeSizes, sortOrder])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[32px] font-medium" style={{ color: '#111111' }}>
            Productos
          </h1>
          <span className="text-[15px]" style={{ color: '#6b6b6b' }}>
            {sorted.length} {sorted.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <select
          value={sortOrder}
          onChange={(e) => updateFilter(() => setSortOrder(e.target.value as SortOrder))}
          className="px-3 py-2 text-[12px] uppercase"
          style={{ letterSpacing: '0.04em', border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
        >
          <option value="default">Orden por defecto</option>
          <option value="name-asc">Nombre A-Z</option>
          <option value="name-desc">Nombre Z-A</option>
          {showPrices && <option value="price-asc">Precio: menor a mayor</option>}
          {showPrices && <option value="price-desc">Precio: mayor a menor</option>}
        </select>
      </div>

      {/* Buscador + filtros */}
      <div
        className="mt-8 flex flex-wrap items-center gap-3 pb-6"
        style={{ borderBottom: '1px solid #e5e5e5' }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => updateFilter(() => setSearch(e.target.value))}
          placeholder="Buscar productos..."
          className="px-4 py-2 text-[13px] outline-none"
          style={{ border: '1px solid #e5e5e5', color: '#111111', minWidth: '220px' }}
        />

        {categories.length > 0 && (
          <FilterDropdown
            label="Categoría"
            options={categories}
            selected={activeCategories}
            onToggle={toggleCategory}
            onClear={() => updateFilter(() => setActiveCategories(new Set()))}
          />
        )}

        {sizes.length > 0 && (
          <FilterDropdown
            label="Talle"
            options={sizes}
            selected={activeSizes}
            onToggle={toggleSize}
            onClear={() => updateFilter(() => setActiveSizes(new Set()))}
          />
        )}
      </div>

      {/* Grid */}
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paged.length === 0 ? (
          <p className="col-span-3 py-10 text-[14px]" style={{ color: '#6b6b6b' }}>
            No hay productos con ese filtro.
          </p>
        ) : (
          paged.map((product) => (
            <ProductCard key={product.id} product={product} slug={slug} showPrices={showPrices} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-[13px] disabled:opacity-40"
            style={{ border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
          >
            ← Anterior
          </button>
          <span className="text-[13px]" style={{ color: '#6b6b6b' }}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-[13px] disabled:opacity-40"
            style={{ border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </>
  )
}
