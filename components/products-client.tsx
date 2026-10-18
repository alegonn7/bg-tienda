'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowUpDown, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { categoryLabel, normalizeText, type Product } from '@/lib/products'

const PAGE_SIZE = 24

type Sort = 'default' | 'new' | 'price-asc' | 'price-desc' | 'name'

const SORT_LABEL: Record<Sort, string> = {
  default: 'Destacados',
  new: 'Más nuevos',
  'price-asc': 'Menor precio',
  'price-desc': 'Mayor precio',
  name: 'Nombre A-Z',
}

// Talles de ropa en su orden natural (S antes que M); el resto, numérico/alfabético.
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase())
  const ib = SIZE_ORDER.indexOf(b.toUpperCase())
  if (ia >= 0 && ib >= 0) return ia - ib
  if (ia >= 0 || ib >= 0) return ia >= 0 ? -1 : 1
  return a.localeCompare(b, 'es', { numeric: true })
}

// Lee ?categoria= y ?q= de la URL (los links del menú, del pie y del buscador). Va en su propio
// componente porque useSearchParams necesita un <Suspense> para que la página siga cacheada.
export function ProductsFromUrl(props: { products: Product[]; slug: string; showPrices: boolean }) {
  const params = useSearchParams()
  return <ProductsClient {...props} initialCategory={params.get('categoria') ?? ''} query={params.get('q') ?? ''} />
}

export function ProductsClient({
  products,
  slug,
  showPrices,
  initialCategory = '',
  query = '',
}: {
  products: Product[]
  slug: string
  showPrices: boolean
  initialCategory?: string
  query?: string
}) {
  const [category, setCategory] = useState(initialCategory)
  const [search, setSearch] = useState(query)
  const [sizes, setSizes] = useState<Set<string>>(new Set())
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<Sort>('default')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [sheet, setSheet] = useState(false)

  // Categorías y talles salen de los productos ya traídos (store_catalog es lo único público).
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    products.forEach((p) => p.category && counts.set(p.category, (counts.get(p.category) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [products])

  const allSizes = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => (category ? p.category === category : true) && p.sizes.forEach((s) => set.add(s)))
    return [...set].sort(compareSizes)
  }, [products, category])

  // Navegar desde el menú o el buscador (con la página ya abierta) cambia la URL: se sigue.
  useEffect(() => {
    setCategory(initialCategory)
    setVisible(PAGE_SIZE)
  }, [initialCategory])
  useEffect(() => setSearch(query), [query])

  // Cambiar la categoría deja la URL al día (para compartirla) sin recargar la página.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (category) url.searchParams.set('categoria', category)
    else url.searchParams.delete('categoria')
    if (search) url.searchParams.set('q', search)
    else url.searchParams.delete('q')
    window.history.replaceState(null, '', url)
  }, [category, search])

  useEffect(() => {
    document.body.style.overflow = sheet ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheet])

  const min = Number(minPrice) || 0
  const max = Number(maxPrice) || 0

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = products.filter((p) => {
      if (category && p.category !== category) return false
      if (term && !`${p.name} ${p.category}`.toLowerCase().includes(term)) return false
      if (sizes.size && !p.sizes.some((s) => sizes.has(s))) return false
      if (showPrices && min && (p.price ?? 0) < min) return false
      if (showPrices && max && (p.price ?? 0) > max) return false
      return true
    })
    switch (sort) {
      case 'new':
        return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
      case 'price-asc':
        return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      case 'price-desc':
        return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return list.sort((a, b) => Number(b.featured) - Number(a.featured))
    }
  }, [products, category, search, sizes, min, max, showPrices, sort])

  const shown = filtered.slice(0, visible)
  const sorts = (Object.keys(SORT_LABEL) as Sort[]).filter((s) => showPrices || !s.startsWith('price'))
  const extraFilters = sizes.size + (min ? 1 : 0) + (max ? 1 : 0)

  function pickCategory(c: string) {
    setCategory(c)
    setSizes(new Set())
    setVisible(PAGE_SIZE)
  }

  function toggleSize(s: string) {
    setSizes((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
    setVisible(PAGE_SIZE)
  }

  function clearAll() {
    setSizes(new Set())
    setMinPrice('')
    setMaxPrice('')
    setSearch('')
    setVisible(PAGE_SIZE)
  }

  const title = search ? `Resultados para “${search}”` : categoryLabel(category) || 'Todos los productos'

  const sizeChips = allSizes.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {allSizes.map((s) => (
        <button key={s} type="button" aria-pressed={sizes.has(s)} onClick={() => toggleSize(s)} className="st-chip">
          {s}
        </button>
      ))}
    </div>
  )

  const priceInputs = showPrices && (
    <div className="flex items-center gap-2">
      <input value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="$ Mín." aria-label="Precio mínimo" className="st-input !h-10 !rounded-[10px] !text-[14px]" />
      <span style={{ color: 'var(--st-soft)' }}>–</span>
      <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="$ Máx." aria-label="Precio máximo" className="st-input !h-10 !rounded-[10px] !text-[14px]" />
    </div>
  )

  return (
    <div className="st-wrap">
      <div className="mb-3 mt-[18px] flex items-end justify-between gap-4 md:mb-[26px] md:mt-8">
        <div className="min-w-0">
          <h1 className="truncate text-[26px] font-bold tracking-[-0.02em] md:text-[36px]">{title}</h1>
          <p className="text-[14px] md:text-[15px]" style={{ color: 'var(--st-mut)' }}>
            {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <label className="relative hidden md:block">
          <span className="sr-only">Ordenar</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-[42px] appearance-none rounded-full border bg-white pl-4 pr-10 text-[14px] outline-none" style={{ borderColor: 'var(--st-line)' }}>
            {sorts.map((s) => (
              <option key={s} value={s}>
                Ordenar: {SORT_LABEL[s]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        </label>
      </div>

      {/* Celular: categorías deslizables + botones de filtros y orden */}
      {categories.length > 1 && (
        <div className="st-noscroll sticky top-[58px] z-20 -mx-4 flex gap-2 overflow-x-auto border-b bg-white px-4 py-2.5 md:hidden" style={{ borderColor: 'var(--st-line2)' }}>
          {categories.length > CATEGORY_SEARCH_FROM && (
            <button type="button" onClick={() => setSheet(true)} aria-label="Buscar categoría" className="st-chip !px-3">
              <Search className="h-4 w-4" />
            </button>
          )}
          {[['', products.length] as [string, number], ...categories].map(([c]) => (
            <button key={c || 'todos'} type="button" aria-pressed={category === c} onClick={() => pickCategory(c)} className="st-chip">
              {c ? categoryLabel(c) : 'Todos'}
            </button>
          ))}
        </div>
      )}
      <div className="my-3.5 flex gap-2 md:hidden">
        <button type="button" onClick={() => setSheet(true)} className="st-btn st-btn-ghost !h-[42px] flex-1 !text-[14px] !font-medium">
          <SlidersHorizontal />
          Filtros{extraFilters ? ` (${extraFilters})` : ''}
        </button>
        <label className="relative flex-1">
          <span className="sr-only">Ordenar</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-[42px] w-full appearance-none rounded-full border bg-white pl-10 pr-4 text-center text-[14px] outline-none" style={{ borderColor: 'var(--st-line)' }}>
            {sorts.map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
          <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
        </label>
      </div>

      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-10 lg:grid-cols-[240px_1fr]">
        {/* Compu: filtros al costado */}
        <aside className="hidden md:block">
          {categories.length > 1 && (
            <div className="pb-5">
              <h4 className="mb-3 text-[14px] font-bold">Categorías</h4>
              <CategoryFilter categories={categories} total={products.length} value={category} onPick={pickCategory} />
            </div>
          )}
          {sizeChips && (
            <div className="border-t py-5" style={{ borderColor: 'var(--st-line2)' }}>
              <h4 className="mb-3 text-[14px] font-bold">Talle</h4>
              {sizeChips}
            </div>
          )}
          {priceInputs && (
            <div className="border-t py-5" style={{ borderColor: 'var(--st-line2)' }}>
              <h4 className="mb-3 text-[14px] font-bold">Precio</h4>
              {priceInputs}
            </div>
          )}
        </aside>

        <section className="min-w-0">
          {(extraFilters > 0 || search) && (
            <div className="mb-5 hidden flex-wrap items-center gap-2 md:flex">
              {search && (
                <button type="button" onClick={() => setSearch('')} className="st-chip !h-8 !text-[13px]" style={{ backgroundColor: 'var(--st-sf)', borderColor: 'var(--st-sf)' }}>
                  “{search}” <X className="h-3.5 w-3.5" />
                </button>
              )}
              {[...sizes].map((s) => (
                <button key={s} type="button" onClick={() => toggleSize(s)} className="st-chip !h-8 !text-[13px]" style={{ backgroundColor: 'var(--st-sf)', borderColor: 'var(--st-sf)' }}>
                  Talle {s} <X className="h-3.5 w-3.5" />
                </button>
              ))}
              {(min > 0 || max > 0) && (
                <button type="button" onClick={() => { setMinPrice(''); setMaxPrice('') }} className="st-chip !h-8 !text-[13px]" style={{ backgroundColor: 'var(--st-sf)', borderColor: 'var(--st-sf)' }}>
                  Precio <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button type="button" onClick={clearAll} className="text-[13px] underline" style={{ color: 'var(--st-mut)' }}>
                Limpiar filtros
              </button>
            </div>
          )}

          {shown.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[15px]" style={{ color: 'var(--st-mut)' }}>
                No encontramos productos con esos filtros.
              </p>
              <button type="button" onClick={() => { clearAll(); pickCategory('') }} className="st-btn st-btn-sm mt-4">
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-[22px] md:gap-x-5 md:gap-y-7 lg:grid-cols-3">
              {shown.map((p) => (
                <ProductCard key={p.id} product={p} slug={slug} showPrices={showPrices} />
              ))}
            </div>
          )}

          {filtered.length > shown.length && (
            <div className="mt-11 flex flex-col items-center gap-3 text-[13px]" style={{ color: 'var(--st-mut)' }}>
              Viste {shown.length} de {filtered.length} productos
              <div className="h-[3px] w-[220px] overflow-hidden rounded" style={{ backgroundColor: 'var(--st-line)' }}>
                <div className="h-full" style={{ width: `${(shown.length / filtered.length) * 100}%`, backgroundColor: 'var(--st-ink)' }} />
              </div>
              <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="st-btn">
                Cargar más
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Celular: panel de filtros que sube desde abajo */}
      {sheet && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(15,15,15,.42)' }} onClick={() => setSheet(false)} />
          <div role="dialog" aria-modal="true" aria-label="Filtrar y ordenar" className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[22px] bg-white">
            <div className="mx-auto mt-2.5 h-[5px] w-10 rounded" style={{ backgroundColor: 'var(--st-line)' }} />
            <div className="flex items-center justify-between border-b px-4 pb-3.5 pt-3" style={{ borderColor: 'var(--st-line2)' }}>
              <h3 className="text-[18px] font-bold">Filtrar y ordenar</h3>
              <button type="button" onClick={() => setSheet(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-1.5">
              {categories.length > 1 && (
                <div className="border-b py-4" style={{ borderColor: 'var(--st-line2)' }}>
                  <h4 className="mb-2 text-[14px] font-bold">Categorías</h4>
                  <CategoryFilter categories={categories} total={products.length} value={category} onPick={pickCategory} />
                </div>
              )}
              <div className="py-4">
                <h4 className="mb-2 text-[14px] font-bold">Ordenar por</h4>
                {sorts.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center justify-between py-2.5 text-[15px]">
                    {SORT_LABEL[s]}
                    <input type="radio" name="sort" checked={sort === s} onChange={() => setSort(s)} className="h-5 w-5 accent-[var(--st-ink)]" />
                  </label>
                ))}
              </div>
              {sizeChips && (
                <div className="border-t py-4" style={{ borderColor: 'var(--st-line2)' }}>
                  <h4 className="mb-3 text-[14px] font-bold">Talle</h4>
                  {sizeChips}
                </div>
              )}
              {priceInputs && (
                <div className="border-t py-4" style={{ borderColor: 'var(--st-line2)' }}>
                  <h4 className="mb-3 text-[14px] font-bold">Precio</h4>
                  {priceInputs}
                </div>
              )}
            </div>
            <div className="flex gap-2.5 border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--st-line)' }}>
              <button type="button" onClick={clearAll} className="st-btn st-btn-ghost flex-1">
                Limpiar
              </button>
              <button type="button" onClick={() => setSheet(false)} className="st-btn st-btn-dark flex-1">
                Ver {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Con más de 5 categorías la lista lleva un buscador arriba (sin tildes ni mayúsculas).
const CATEGORY_SEARCH_FROM = 5

function CategoryFilter({
  categories,
  total,
  value,
  onPick,
}: {
  categories: [string, number][]
  total: number
  value: string
  onPick: (c: string) => void
}) {
  const [find, setFind] = useState('')
  const q = normalizeText(find)
  const list = q ? categories.filter(([c]) => normalizeText(c).includes(q)) : categories
  return (
    <>
      {categories.length > CATEGORY_SEARCH_FROM && (
        <label className="relative mb-2 block">
          <span className="sr-only">Buscar categoría</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--st-soft)' }} />
          <input
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder="Buscar categoría…"
            className="st-input !h-10 !rounded-[10px] !pl-9 !text-[14px]"
          />
        </label>
      )}
      {(q ? list : [['', total] as [string, number], ...list]).map(([c, n]) => (
        <button
          key={c || 'todos'}
          type="button"
          onClick={() => onPick(c)}
          className="-mx-2.5 flex w-[calc(100%+20px)] justify-between gap-3 rounded-[10px] px-2.5 py-[7px] text-left text-[15px]"
          style={value === c ? { backgroundColor: 'var(--st-sf)', fontWeight: 600 } : { color: 'var(--st-ink2)' }}
        >
          <span className="min-w-0 [overflow-wrap:anywhere]">{c ? categoryLabel(c) : 'Todos'}</span>
          <small style={{ color: 'var(--st-soft)' }}>{n}</small>
        </button>
      ))}
      {q && list.length === 0 && (
        <p className="py-2 text-[14px]" style={{ color: 'var(--st-mut)' }}>
          No hay categorías con “{find}”.
        </p>
      )}
    </>
  )
}
