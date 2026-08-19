'use client'

import Link from 'next/link'
import { ShoppingBag, User } from 'lucide-react'
import { useCart } from '@/components/cart-context'
import type { Store } from '@/lib/tenant'

export function Navbar({ store }: { store: Store }) {
  const { totalCount, openCart } = useCart()
  const brandName = store.storeName ?? store.organizationName

  const navLinks = [
    { href: `/${store.slug}`, label: 'Inicio' },
    { href: `/${store.slug}/productos`, label: 'Productos' },
  ]

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e5e5',
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link
          href={`/${store.slug}`}
          className="flex items-center gap-2 text-[17px] font-medium tracking-tight"
          style={{ color: '#111111' }}
        >
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={brandName} className="h-8 w-auto object-contain" />
          ) : (
            brandName
          )}
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link text-[12px] uppercase"
              style={{ letterSpacing: '0.08em', color: '#6b6b6b' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/login"
            aria-label="Iniciar sesión"
            className="inline-flex items-center justify-center p-1"
            style={{ color: '#111111' }}
          >
            <User size={20} strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            onClick={openCart}
          aria-label="Abrir carrito"
          className="relative inline-flex items-center justify-center p-1"
          style={{ color: '#111111' }}
        >
          <ShoppingBag size={20} strokeWidth={1.5} />
          {totalCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 block h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-accent)' }}
              aria-hidden="true"
            />
          )}
          </button>
        </div>
      </div>
    </header>
  )
}
