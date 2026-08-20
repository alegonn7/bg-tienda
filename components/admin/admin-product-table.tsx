'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/products'
import { productImage } from '@/lib/products'
import { formatPrice } from '@/lib/format'
import {
  removeProductFromStore,
  restoreProductToStore,
  toggleProductActive,
  toggleProductFeatured,
} from '@/app/admin/actions'

const PAGE_SIZE = 20

type SortKey = 'default' | 'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc'
type StatusFilter = 'all' | 'active' | 'inactive'

export function AdminProductTable({ products }: { products: Product[] }) {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('default')
  const [page, setPage] = useState(1)

  const categories = useMemo(() => {
    const names = new Set(products.map((p) => p.category).filter(Boolean))
    return Array.from(names).sort()
  }, [products])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((p) => {
      const searchMatch = !term || p.name.toLowerCase().includes(term)
      const categoryMatch = !category || p.category === category
      const statusMatch = status === 'all' || (status === 'active' ? p.active : !p.active)
      return searchMatch && categoryMatch && statusMatch
    })
  }, [products, search, category, status])

  const sorted = useMemo(() => {
    const list = [...filtered]
    switch (sort) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name))
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name))
      case 'stock-asc':
        return list.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      case 'stock-desc':
        return list.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
      default:
        return list
    }
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function updateFilter(fn: () => void) {
    fn()
    setPage(1)
  }

  async function handleRemove(productBranchId: string | undefined, name: string) {
    if (!productBranchId) return
    if (!confirm(`¿Sacar "${name}" de la tienda online? El producto sigue existiendo en bg-gestion, y podés volver a mostrarlo cuando quieras.`)) return
    await removeProductFromStore(productBranchId)
    router.refresh()
  }

  async function handleRestore(productBranchId: string | undefined) {
    if (!productBranchId) return
    await restoreProductToStore(productBranchId)
    router.refresh()
  }

  async function handleToggleActive(id: string, current: boolean) {
    await toggleProductActive(id, !current)
    router.refresh()
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    await toggleProductFeatured(id, !current)
    router.refresh()
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-[14px]" style={{ color: '#6b6b6b' }}>
        No hay productos todavía.{' '}
        <Link href="/admin/productos/nuevo" style={{ color: '#d81b8a' }}>
          Creá el primero →
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Barra de filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => updateFilter(() => setSearch(e.target.value))}
          placeholder="Buscar por nombre..."
          className="px-3 py-2 text-[13px]"
          style={{ border: '1px solid #e5e5e5', color: '#111111', minWidth: '220px' }}
        />

        <select
          value={category}
          onChange={(e) => updateFilter(() => setCategory(e.target.value))}
          className="px-3 py-2 text-[13px]"
          style={{ border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex" style={{ border: '1px solid #e5e5e5' }}>
          {(
            [
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Habilitados' },
              { value: 'inactive', label: 'No habilitados' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateFilter(() => setStatus(opt.value))}
              className="px-3 py-2 text-[12px] uppercase"
              style={{
                letterSpacing: '0.03em',
                backgroundColor: status === opt.value ? '#111111' : '#fff',
                color: status === opt.value ? '#fff' : '#6b6b6b',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => updateFilter(() => setSort(e.target.value as SortKey))}
          className="px-3 py-2 text-[13px]"
          style={{ border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
        >
          <option value="default">Orden por defecto</option>
          <option value="name-asc">Nombre A-Z</option>
          <option value="name-desc">Nombre Z-A</option>
          <option value="stock-asc">Stock: menor a mayor</option>
          <option value="stock-desc">Stock: mayor a menor</option>
        </select>

        <span className="text-[13px]" style={{ color: '#6b6b6b' }}>
          {sorted.length} {sorted.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      <div style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
              {['Producto', 'Categoría', 'Precio', 'Stock', 'Más vendido', 'Estado', 'Acciones'].map((h) => (
                <th
                  key={h}
                  className="px-6 py-4 text-left text-[12px] uppercase"
                  style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-[14px]" style={{ color: '#6b6b6b' }}>
                  No hay productos con esos filtros.
                </td>
              </tr>
            ) : (
              paged.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#f5f5f3' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productImage(product) || '/placeholder.jpg'}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-[14px] font-medium" style={{ color: '#111111' }}>
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[14px]" style={{ color: '#6b6b6b' }}>
                    {product.category}
                  </td>
                  <td className="px-6 py-4 text-[14px]" style={{ color: '#6b6b6b' }}>
                    {formatPrice(product.price)}
                  </td>
                  <td
                    className="px-6 py-4 text-[14px]"
                    style={{ color: product.stock === 0 ? '#d81b8a' : '#6b6b6b', fontWeight: product.stock === 0 ? 600 : 400 }}
                  >
                    {product.stock ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(product.id, product.featured)}
                      className="text-[12px] uppercase"
                      style={{
                        letterSpacing: '0.04em',
                        color: product.featured ? '#d81b8a' : '#6b6b6b',
                      }}
                    >
                      {product.featured ? '★ Sí' : '☆ No'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {product.branchActive === false ? (
                      <span
                        className="text-[12px] uppercase"
                        style={{ letterSpacing: '0.04em', color: '#6b6b6b' }}
                        title="Sacado de la tienda a mano"
                      >
                        ⊘ Fuera de la tienda
                      </span>
                    ) : product.stock === 0 ? (
                      <span
                        className="text-[12px] uppercase"
                        style={{ letterSpacing: '0.04em', color: '#b45309' }}
                        title="No aparece en la tienda hasta que tenga stock de nuevo"
                      >
                        ⚠ Sin stock
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(product.id, product.active)}
                        className="text-[12px] uppercase"
                        style={{
                          letterSpacing: '0.04em',
                          color: product.active ? '#16a34a' : '#6b6b6b',
                        }}
                      >
                        {product.active ? '● Activo' : '○ Inactivo'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/admin/productos/${product.id}/editar`} className="text-[13px]" style={{ color: '#111111' }}>
                        Editar
                      </Link>
                      {product.branchActive === false ? (
                        <button
                          type="button"
                          onClick={() => handleRestore(product.productBranchId)}
                          className="text-[13px]"
                          style={{ color: '#16a34a' }}
                        >
                          Reactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemove(product.productBranchId, product.name)}
                          className="text-[13px]"
                          style={{ color: '#d81b8a' }}
                        >
                          Sacar de la tienda
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
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
    </div>
  )
}
