'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Percent,
  Search,
  Star,
  Tag,
  X,
} from 'lucide-react'
import { productImage, type Product } from '@/lib/products'
import { formatPrice } from '@/lib/format'
import {
  bulkAdjustProductsPrice,
  bulkSetProductsActive,
  bulkSetProductsCategory,
  removeProductFromStore,
  restoreProductToStore,
  toggleProductActive,
  toggleProductFeatured,
} from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ErrorText, Toggle } from '@/components/admin/ui'

const PAGE_SIZE = 20
// Por debajo de esto (y sin estar en cero) el producto cuenta como "stock bajo".
const LOW_STOCK = 3

type Filter = 'todos' | 'sin-stock' | 'stock-bajo' | 'ocultos' | 'sin-foto'
type SortKey = 'default' | 'name-asc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'

const SORT_LABEL: Record<SortKey, string> = {
  default: 'Más nuevos',
  'name-asc': 'Nombre (A-Z)',
  'price-asc': 'Precio: menor a mayor',
  'price-desc': 'Precio: mayor a menor',
  'stock-asc': 'Stock: menor a mayor',
  'stock-desc': 'Stock: mayor a menor',
}

// Un producto "se ve" en la tienda si está activo, no fue sacado de la sucursal online y tiene
// stock (store_catalog esconde los que están en cero).
function isHidden(p: Product) {
  return !p.active || p.branchActive === false
}

function matchesFilter(p: Product, f: Filter) {
  switch (f) {
    case 'sin-stock':
      return !isHidden(p) && p.stock === 0
    case 'stock-bajo':
      return !isHidden(p) && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK
    case 'ocultos':
      return isHidden(p)
    case 'sin-foto':
      return p.images.length === 0
    default:
      return true
  }
}

export function AdminProductTable({
  products,
  categories,
  initialSearch = '',
  initialFilter = 'todos',
}: {
  products: Product[]
  categories: { id: string; name: string }[]
  initialSearch?: string
  initialFilter?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [filter, setFilter] = useState<Filter>(
    (['todos', 'sin-stock', 'stock-bajo', 'ocultos', 'sin-foto'] as const).includes(initialFilter as Filter)
      ? (initialFilter as Filter)
      : 'todos',
  )
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<SortKey>('default')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<{ productBranchId: string; name: string } | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [bulkMode, setBulkMode] = useState<null | 'category' | 'price'>(null)
  const [bulkCategory, setBulkCategory] = useState(categories[0]?.id ?? '')
  const [bulkPercent, setBulkPercent] = useState('10')

  const categoryNames = useMemo(() => {
    const names = new Set(products.map((p) => p.category).filter(Boolean))
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'es'))
  }, [products])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { todos: products.length, 'sin-stock': 0, 'stock-bajo': 0, ocultos: 0, 'sin-foto': 0 }
    for (const p of products) {
      for (const f of ['sin-stock', 'stock-bajo', 'ocultos', 'sin-foto'] as const) if (matchesFilter(p, f)) c[f]++
    }
    return c
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = products.filter(
      (p) => (!q || p.name.toLowerCase().includes(q)) && (!category || p.category === category) && matchesFilter(p, filter),
    )
    switch (sort) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'es'))
      case 'price-asc':
        return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      case 'price-desc':
        return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      case 'stock-asc':
        return list.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      case 'stock-desc':
        return list.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
      default:
        return list
    }
  }, [products, search, category, filter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const allOnPageSelected = paged.length > 0 && paged.every((p) => selected.has(p.id))

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(1)
    }
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await fn()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio.')
    } finally {
      setBusy(false)
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectPage() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) paged.forEach((p) => next.delete(p.id))
      else paged.forEach((p) => next.add(p.id))
      return next
    })
  }

  const selectedIds = Array.from(selected)
  const selectedBranchIds = products
    .filter((p) => selected.has(p.id) && p.productBranchId)
    .map((p) => p.productBranchId as string)

  async function bulk(fn: () => Promise<unknown>) {
    await run(fn)
    setBulkMode(null)
    setSelected(new Set())
  }

  if (products.length === 0) {
    return (
      <div className="adm-card px-6 py-16 text-center">
        <p className="text-[15px] font-medium">Todavía no cargaste productos.</p>
        <p className="mt-1 adm-hint">Los productos que cargues en BG Gestión para la sucursal online también aparecen acá.</p>
        <Link href="/admin/productos/nuevo" className="adm-btn adm-btn-pri mt-5">
          Cargar el primero
        </Link>
      </div>
    )
  }

  const chips: { value: Filter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'sin-stock', label: 'Sin stock' },
    { value: 'stock-bajo', label: 'Stock bajo' },
    { value: 'ocultos', label: 'Ocultos' },
    { value: 'sin-foto', label: 'Sin foto' },
  ]

  return (
    <div>
      <ConfirmDialog
        open={!!removing}
        title="Quitar de la tienda"
        message={
          removing
            ? `¿Quitar "${removing.name}" de la tienda online? Sigue existiendo en BG Gestión y podés volver a agregarlo cuando quieras.`
            : ''
        }
        confirmText="Quitar"
        danger
        onConfirm={() => {
          const r = removing
          setRemoving(null)
          if (r) run(() => removeProductFromStore(r.productBranchId))
        }}
        onCancel={() => setRemoving(null)}
      />

      {/* Búsqueda y filtros del celular */}
      <div className="mb-3 md:hidden">
        <label className="mb-2.5 flex items-center gap-2 rounded-[10px] bg-white px-3" style={{ border: '1px solid var(--adm-line)' }}>
          <Search className="h-[17px] w-[17px]" style={{ color: 'var(--adm-soft)' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            placeholder="Buscar producto…"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none"
          />
        </label>
        <div className="adm-scroll-x -mx-4 px-4">
          {chips.map((c) => (
            <button key={c.value} type="button" className="adm-chip" data-on={filter === c.value} onClick={() => resetPage(setFilter)(c.value)}>
              {c.label} <span className="n">{counts[c.value]}</span>
            </button>
          ))}
        </div>
        <div className="mt-2.5 flex gap-2">
          <select value={category} onChange={(e) => resetPage(setCategory)(e.target.value)} className="adm-input !min-h-[38px] flex-1 !py-1.5 text-[13px]">
            <option value="">Todas las categorías</option>
            {categoryNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="adm-input !min-h-[38px] flex-1 !py-1.5 text-[13px]">
            {Object.entries(SORT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {/* Barra de acciones en lote (solo compu) */}
      {selected.size > 0 && (
        <div className="mb-3 hidden flex-wrap items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-white md:flex" style={{ backgroundColor: 'var(--adm-ink)' }}>
          <button type="button" onClick={() => setSelected(new Set())} className="grid h-7 w-7 place-items-center rounded-md hover:bg-white/10" aria-label="Deseleccionar">
            <X className="h-4 w-4" />
          </button>
          <b className="text-[13.5px]">
            {selected.size} {selected.size === 1 ? 'seleccionado' : 'seleccionados'}
          </b>
          <span className="flex-1" />
          {bulkMode === 'category' ? (
            <>
              <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="rounded-lg px-2 py-1.5 text-[13px] text-black">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <BulkBtn disabled={busy || !bulkCategory} onClick={() => bulk(() => bulkSetProductsCategory(selectedIds, bulkCategory))}>
                Aplicar
              </BulkBtn>
              <BulkBtn onClick={() => setBulkMode(null)}>Cancelar</BulkBtn>
            </>
          ) : bulkMode === 'price' ? (
            <>
              <span className="text-[13px] opacity-80">Cambiar precio</span>
              <input
                type="number"
                value={bulkPercent}
                onChange={(e) => setBulkPercent(e.target.value)}
                className="w-20 rounded-lg px-2 py-1.5 text-[13px] text-black"
                aria-label="Porcentaje"
              />
              <span className="text-[13px] opacity-80">% (negativo baja)</span>
              <BulkBtn
                disabled={busy || !Number(bulkPercent)}
                onClick={() => bulk(() => bulkAdjustProductsPrice(selectedBranchIds, Number(bulkPercent)))}
              >
                Aplicar
              </BulkBtn>
              <BulkBtn onClick={() => setBulkMode(null)}>Cancelar</BulkBtn>
            </>
          ) : (
            <>
              <BulkBtn disabled={busy} onClick={() => bulk(() => bulkSetProductsActive(selectedIds, true))}>
                <Eye /> Mostrar
              </BulkBtn>
              <BulkBtn disabled={busy} onClick={() => bulk(() => bulkSetProductsActive(selectedIds, false))}>
                <EyeOff /> Ocultar
              </BulkBtn>
              {categories.length > 0 && (
                <BulkBtn disabled={busy} onClick={() => setBulkMode('category')}>
                  <Tag /> Cambiar categoría
                </BulkBtn>
              )}
              <BulkBtn disabled={busy} onClick={() => setBulkMode('price')}>
                <Percent /> Ajustar precio
              </BulkBtn>
            </>
          )}
        </div>
      )}

      {/* Tabla (compu) */}
      <div className="adm-card hidden overflow-hidden md:block">
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: '1px solid var(--adm-line2)' }}>
          <label className="flex w-[220px] items-center gap-2 rounded-[10px] bg-white px-3" style={{ border: '1px solid var(--adm-line)' }}>
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--adm-soft)' }} />
            <input
              type="search"
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
              placeholder="Buscar por nombre…"
              className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button key={c.value} type="button" className="adm-chip" data-on={filter === c.value} onClick={() => resetPage(setFilter)(c.value)}>
                {c.label} <span className="n">{counts[c.value]}</span>
              </button>
            ))}
          </div>
          <span className="flex-1" />
          <select value={category} onChange={(e) => resetPage(setCategory)(e.target.value)} className="adm-input !min-h-[36px] !w-auto !py-1.5 text-[13px]">
            <option value="">Categoría: todas</option>
            {categoryNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--adm-muted)' }}>
            <ArrowUpDown className="h-4 w-4" />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="adm-input !min-h-[36px] !w-auto !py-1.5 text-[13px]">
              {Object.entries(SORT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[12px]" style={{ color: 'var(--adm-muted)', backgroundColor: '#fbfbfa' }}>
              <th className="w-10 px-4 py-2.5 font-medium" style={{ borderBottom: '1px solid var(--adm-line)' }}>
                <input type="checkbox" className="adm-check" checked={allOnPageSelected} onChange={toggleSelectPage} aria-label="Seleccionar todos" />
              </th>
              {['Producto', 'Categoría', 'Precio', 'Stock', 'En tienda', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 font-medium" style={{ borderBottom: '1px solid var(--adm-line)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center adm-hint">
                  No hay productos con esos filtros.
                </td>
              </tr>
            ) : (
              paged.map((p) => (
                <tr
                  key={p.id}
                  className="[&:not(:last-child)>td]:border-b"
                  style={{ backgroundColor: selected.has(p.id) ? '#fafaf8' : undefined, borderColor: 'var(--adm-line2)' }}
                >
                  <td className="px-4 py-2.5" style={{ borderColor: 'var(--adm-line2)' }}>
                    <input type="checkbox" className="adm-check" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label={`Seleccionar ${p.name}`} />
                  </td>
                  <td className="px-4 py-2.5" style={{ borderColor: 'var(--adm-line2)' }}>
                    <Link href={`/admin/productos/${p.id}/editar`} className="flex items-center gap-3">
                      <Thumb product={p} size={44} />
                      <span className="min-w-0">
                        <b className="flex items-center gap-1.5 font-medium">
                          <span className="truncate">{p.name}</span>
                          {p.featured && <Star className="h-3.5 w-3.5 flex-shrink-0 fill-current" style={{ color: 'var(--adm-accent)' }} />}
                        </b>
                        <span className="block truncate text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
                          {p.sizes.length ? `Tamaños: ${p.sizes.join(' · ')}` : p.images.length ? 'Sin tamaños' : 'Sin foto'}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--adm-muted)', borderColor: 'var(--adm-line2)' }}>
                    {p.category || '—'}
                  </td>
                  <td className="px-4 py-2.5 font-semibold" style={{ borderColor: 'var(--adm-line2)' }}>
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-2.5" style={{ borderColor: 'var(--adm-line2)' }}>
                    <StockCell product={p} />
                  </td>
                  <td className="px-4 py-2.5" style={{ borderColor: 'var(--adm-line2)' }}>
                    {p.branchActive === false ? (
                      <span className="adm-badge adm-b-gray">Quitado</span>
                    ) : (
                      <Toggle
                        checked={p.active}
                        disabled={busy}
                        label={p.active ? `Ocultar ${p.name}` : `Mostrar ${p.name}`}
                        onChange={(next) => run(() => toggleProductActive(p.id, next))}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ borderColor: 'var(--adm-line2)' }}>
                    <div className="relative inline-flex items-center">
                      <Link href={`/admin/productos/${p.id}/editar`} className="adm-btn adm-btn-ghost adm-btn-sm" aria-label="Editar">
                        <Pencil />
                      </Link>
                      <button
                        type="button"
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        aria-label="Más acciones"
                        onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                      >
                        <MoreHorizontal />
                      </button>
                      {menuFor === p.id && (
                        <RowMenu
                          product={p}
                          onClose={() => setMenuFor(null)}
                          onFeatured={() => run(() => toggleProductFeatured(p.id, !p.featured))}
                          onRemove={() => p.productBranchId && setRemoving({ productBranchId: p.productBranchId, name: p.name })}
                          onRestore={() => p.productBranchId && run(() => restoreProductToStore(p.productBranchId as string))}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pager page={currentPage} totalPages={totalPages} total={filtered.length} onPage={setPage} />
      </div>

      {/* Tarjetas (celular) */}
      <div className="adm-card overflow-hidden md:hidden">
        {paged.length === 0 ? (
          <p className="px-4 py-12 text-center adm-hint">No hay productos con esos filtros.</p>
        ) : (
          paged.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3.5 py-3 [&:not(:last-child)]:border-b" style={{ borderColor: 'var(--adm-line2)' }}>
              <Link href={`/admin/productos/${p.id}/editar`} className="flex min-w-0 flex-1 items-center gap-3">
                <Thumb product={p} size={56} />
                <span className="min-w-0 flex-1">
                  <b className="flex items-center gap-1.5 font-medium">
                    <span className="truncate">{p.name}</span>
                    {p.featured && <Star className="h-3.5 w-3.5 flex-shrink-0 fill-current" style={{ color: 'var(--adm-accent)' }} />}
                  </b>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                    <b className="font-semibold">{formatPrice(p.price)}</b>
                    <span style={{ color: 'var(--adm-soft)' }}>·</span>
                    {isHidden(p) ? (
                      <span className="adm-badge adm-b-gray">{p.branchActive === false ? 'Quitado' : 'Oculto'}</span>
                    ) : (
                      <StockCell product={p} prefix />
                    )}
                  </span>
                </span>
              </Link>
              {p.branchActive !== false && (
                <Toggle
                  checked={p.active}
                  disabled={busy}
                  label={p.active ? `Ocultar ${p.name}` : `Mostrar ${p.name}`}
                  onChange={(next) => run(() => toggleProductActive(p.id, next))}
                />
              )}
            </div>
          ))
        )}
        <Pager page={currentPage} totalPages={totalPages} total={filtered.length} onPage={setPage} />
      </div>
    </div>
  )
}

function BulkBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium disabled:opacity-50 [&>svg]:h-[15px] [&>svg]:w-[15px]"
      style={{ border: '1px solid #3a3a40' }}
    >
      {children}
    </button>
  )
}

const THUMB_TONES = ['#fde8f3', '#e8efff', '#e7f6ec', '#fef3e2', '#f1ecfe', '#eceeef']

function Thumb({ product, size }: { product: Product; size: number }) {
  if (product.images.length > 0) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={productImage(product)}
        alt={product.name}
        className="flex-shrink-0 rounded-[10px] object-cover"
        style={{ width: size, height: size, backgroundColor: '#f5f5f3' }}
      />
    )
  }
  const tone = THUMB_TONES[product.name.length % THUMB_TONES.length]
  return (
    <span
      className="grid flex-shrink-0 place-items-center rounded-[10px] text-[15px] font-semibold"
      style={{ width: size, height: size, backgroundColor: tone, color: 'rgba(0,0,0,.45)' }}
    >
      {product.name.slice(0, 1).toUpperCase()}
    </span>
  )
}

function StockCell({ product, prefix }: { product: Product; prefix?: boolean }) {
  const s = product.stock
  if (s == null) return <span style={{ color: 'var(--adm-muted)' }}>—</span>
  if (s === 0) return <span className="adm-badge adm-b-bad">Sin stock</span>
  if (s <= LOW_STOCK) return <span className="adm-badge adm-b-warn">Quedan {s}</span>
  return prefix ? <span style={{ color: 'var(--adm-muted)' }}>Stock {s}</span> : <b className="font-semibold">{s}</b>
}

function RowMenu({
  product,
  onClose,
  onFeatured,
  onRemove,
  onRestore,
}: {
  product: Product
  onClose: () => void
  onFeatured: () => void
  onRemove: () => void
  onRestore: () => void
}) {
  const item = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] hover:bg-[#f6f6f4]'
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl bg-white p-1.5 shadow-lg" style={{ border: '1px solid var(--adm-line)' }}>
        <button
          type="button"
          className={item}
          onClick={() => {
            onClose()
            onFeatured()
          }}
        >
          <Star className="h-4 w-4" />
          {product.featured ? 'Quitar de destacados' : 'Destacar en la tienda'}
        </button>
        {product.branchActive === false ? (
          <button
            type="button"
            className={item}
            style={{ color: 'var(--adm-ok)' }}
            onClick={() => {
              onClose()
              onRestore()
            }}
          >
            <Eye className="h-4 w-4" />
            Volver a agregar a la tienda
          </button>
        ) : (
          <button
            type="button"
            className={item}
            style={{ color: 'var(--adm-bad)' }}
            onClick={() => {
              onClose()
              onRemove()
            }}
          >
            <X className="h-4 w-4" />
            Quitar de la tienda
          </button>
        )}
      </div>
    </>
  )
}

function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(total, page * PAGE_SIZE)
  return (
    <div className="flex items-center justify-between px-4 py-3 text-[13px]" style={{ borderTop: '1px solid var(--adm-line)', color: 'var(--adm-muted)' }}>
      <span>
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" className="adm-btn adm-btn-sm" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Anterior">
          <ChevronLeft />
        </button>
        <span className="px-1.5">
          {page} / {totalPages}
        </span>
        <button type="button" className="adm-btn adm-btn-sm" disabled={page === totalPages} onClick={() => onPage(page + 1)} aria-label="Siguiente">
          <ChevronRight />
        </button>
      </div>
    </div>
  )
}
