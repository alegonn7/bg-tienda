'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/components/cart-context'
import { BENEFIT_ICONS } from '@/components/store/icons'
import { categoryLabel } from '@/lib/products'
import { announcements, storeName } from '@/lib/store-info'
import type { Store } from '@/lib/tenant'

export function StoreBrand({ store, compact = false }: { store: Store; compact?: boolean }) {
  const name = storeName(store)
  const showLogo = store.headerDisplay !== 'name' && !!store.logoUrl
  const showName = store.headerDisplay !== 'logo' || !store.logoUrl
  return (
    <Link href={`/${store.slug}`} className="flex min-w-0 items-center gap-2.5 font-bold tracking-[-0.01em]" style={{ color: 'var(--st-ink)' }}>
      {showLogo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.logoUrl!}
          alt={name}
          style={{ height: `${Math.min(store.logoHeight, compact ? 34 : 44)}px`, width: 'auto' }}
          className="max-w-[160px] object-contain"
        />
      )}
      {showName && <span className={`truncate ${compact ? 'text-[16px]' : 'text-[16px] md:text-[18px]'}`}>{name}</span>}
    </Link>
  )
}

export function Navbar({ store, categories }: { store: Store; categories: string[] }) {
  const { totalCount, openCart } = useCart()
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [term, setTerm] = useState('')
  const base = `/${store.slug}`
  const news = announcements(store)

  const links = [
    { href: base, label: 'Inicio', active: pathname === base },
    { href: `${base}/productos`, label: 'Productos', active: pathname === `${base}/productos` },
    ...categories.slice(0, 3).map((c) => ({ href: `${base}/productos?categoria=${encodeURIComponent(c)}`, label: categoryLabel(c), active: false })),
  ]

  function search(e: React.FormEvent) {
    e.preventDefault()
    const q = term.trim()
    setSearchOpen(false)
    router.push(q ? `${base}/productos?q=${encodeURIComponent(q)}` : `${base}/productos`)
  }

  return (
    <>
      {news.length > 0 && (
        <div className="flex justify-center gap-7 px-4 py-2 text-[12px] text-white md:text-[13px]" style={{ backgroundColor: 'var(--st-ink)' }}>
          {news.map((n, i) => {
            const Icon = BENEFIT_ICONS[n.icon]
            return (
              <span key={n.title} className={`items-center gap-1.5 ${i === 0 ? 'inline-flex' : 'hidden md:inline-flex'}`}>
                <Icon className="h-[15px] w-[15px] opacity-80" />
                {n.title}
              </span>
            )
          })}
        </div>
      )}
      <header className="sticky top-0 z-40 border-b backdrop-blur" style={{ backgroundColor: 'rgba(255,255,255,.96)', borderColor: 'var(--st-line2)' }}>
        <div className="st-wrap flex h-[58px] items-center gap-1.5 md:h-[72px] md:gap-8">
          <div className="mr-auto min-w-0 md:mr-0">
            <StoreBrand store={store} />
          </div>
          <nav className="hidden min-w-0 items-center gap-6 overflow-hidden text-[15px] lg:flex" style={{ color: 'var(--st-ink2)' }}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="whitespace-nowrap hover:opacity-70" style={l.active ? { color: 'var(--st-ink)', fontWeight: 600 } : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>
          <form onSubmit={search} className="ml-auto hidden h-[42px] w-full max-w-[320px] items-center gap-2.5 rounded-full px-4 md:flex" style={{ backgroundColor: 'var(--st-sf)' }}>
            <Search className="h-[18px] w-[18px] flex-shrink-0" style={{ color: 'var(--st-soft)' }} />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar productos…"
              aria-label="Buscar productos"
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
            />
          </form>
          <button type="button" onClick={() => setSearchOpen((o) => !o)} aria-label="Buscar" className="grid h-10 w-10 place-items-center rounded-full md:hidden">
            {searchOpen ? <X className="h-[21px] w-[21px]" /> : <Search className="h-[21px] w-[21px]" />}
          </button>
          <button type="button" onClick={openCart} aria-label="Abrir carrito" className="relative grid h-10 w-10 place-items-center rounded-full md:h-[42px] md:w-[42px]">
            <ShoppingBag className="h-[21px] w-[21px]" strokeWidth={1.8} />
            {totalCount > 0 && (
              <span className="absolute right-0 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-bold text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
                {totalCount}
              </span>
            )}
          </button>
        </div>
        {searchOpen && (
          <form onSubmit={search} className="st-wrap pb-3 md:hidden">
            <div className="flex h-11 items-center gap-2.5 rounded-full px-4" style={{ backgroundColor: 'var(--st-sf)' }}>
              <Search className="h-[18px] w-[18px]" style={{ color: 'var(--st-soft)' }} />
              <input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar productos…"
                aria-label="Buscar productos"
                className="min-w-0 flex-1 bg-transparent text-[16px] outline-none"
              />
            </div>
          </form>
        )}
      </header>
    </>
  )
}
