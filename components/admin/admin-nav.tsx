'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ExternalLink,
  LogOut,
  Menu,
  Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MAIN, NAV_GROUPS, SUSCRIPCION, type NavItem } from '@/components/admin/nav-items'

// Navegación del panel: menú lateral en compu (md+) y, en el celular, barra de arriba + barra de
// pestañas abajo. Las cuatro pestañas de abajo son las pantallas "raíz"; el resto (Categorías,
// Banner, editar producto...) se abre como subpantalla con flecha para volver y sin pestañas,
// como en las apps del celular.

const ROOTS = ['/admin', '/admin/pedidos', '/admin/productos', '/admin/mas']

// Título y destino de la flecha "volver" de cada subpantalla en el celular.
function subScreen(pathname: string): { title: string; back: string } {
  if (pathname === '/admin/productos/nuevo') return { title: 'Nuevo producto', back: '/admin/productos' }
  if (pathname.startsWith('/admin/productos/sugerir-imagenes')) return { title: 'Sugerir fotos', back: '/admin/productos' }
  if (pathname.startsWith('/admin/productos/')) return { title: 'Editar producto', back: '/admin/productos' }
  const map: Record<string, string> = {
    '/admin/categorias': 'Categorías',
    '/admin/tamanos': 'Tamaños y talles',
    '/admin/hero': 'Banner',
    '/admin/personalizacion': 'Apariencia',
    '/admin/configuracion': 'Pagos y envíos',
    '/admin/suscripcion': 'Mi suscripción',
  }
  const key = Object.keys(map).find((k) => pathname.startsWith(k))
  return { title: key ? map[key] : 'Volver', back: '/admin/mas' }
}

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

export type NavStore = {
  name: string
  logoUrl: string | null
  slug: string
  email: string | null
  pendingOrders: number
  showSubscription: boolean
  storeOnline: boolean
}

export function StoreLogo({ name, logoUrl, size = 34 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        className="flex-shrink-0 rounded-[10px] bg-white object-contain"
        style={{ width: size, height: size, border: '1px solid var(--adm-line)' }}
      />
    )
  }
  const letters = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      className="grid flex-shrink-0 place-items-center rounded-[10px] text-[13px] font-bold text-white"
      style={{ width: size, height: size, backgroundColor: 'var(--adm-ink)' }}
    >
      {letters || 'BG'}
    </span>
  )
}

export async function signOut(router: ReturnType<typeof useRouter>) {
  await createClient().auth.signOut()
  router.push('/admin/login')
  router.refresh()
}

function SideLink({ item, pathname, count }: { item: NavItem; pathname: string; count?: number }) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className="flex items-center gap-[11px] rounded-[9px] px-2.5 py-2 text-[14px] transition-colors"
      style={active ? { backgroundColor: 'var(--adm-ink)', color: '#fff' } : { color: '#3b3b42' }}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      {item.label}
      {!!count && (
        <span
          className="ml-auto rounded-full px-[7px] text-[11px] font-semibold"
          style={active ? { backgroundColor: '#fff', color: 'var(--adm-ink)' } : { backgroundColor: 'var(--adm-accent)', color: '#fff' }}
        >
          {count}
        </span>
      )}
    </Link>
  )
}

export function Sidebar({ store }: { store: NavStore }) {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[248px] flex-shrink-0 flex-col gap-1 overflow-y-auto px-3.5 py-[18px] md:flex"
      style={{ backgroundColor: 'var(--adm-surface)', borderRight: '1px solid var(--adm-line)' }}
    >
      <div className="flex items-center gap-2.5 px-2 pb-[18px] pt-1">
        <StoreLogo name={store.name} logoUrl={store.logoUrl} />
        <div className="min-w-0">
          <b className="block truncate text-[14px]">{store.name}</b>
          <span className="text-[12px]" style={{ color: 'var(--adm-muted)' }}>
            Tienda online
          </span>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {MAIN.map((item) => (
          <SideLink
            key={item.href}
            item={item}
            pathname={pathname}
            count={item.href === '/admin/pedidos' ? store.pendingOrders : undefined}
          />
        ))}
        {NAV_GROUPS.map((g) => (
          <div key={g.title} className="flex flex-col gap-0.5">
            <div className="px-2.5 pb-1.5 pt-3.5 text-[11px] uppercase tracking-[0.07em]" style={{ color: 'var(--adm-soft)' }}>
              {g.title}
            </div>
            {g.items.map((item) => (
              <SideLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        ))}
        {store.showSubscription && (
          <>
            <div className="px-2.5 pb-1.5 pt-3.5 text-[11px] uppercase tracking-[0.07em]" style={{ color: 'var(--adm-soft)' }}>
              Cuenta
            </div>
            <SideLink item={SUSCRIPCION} pathname={pathname} />
          </>
        )}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 pl-1.5 pt-3" style={{ borderTop: '1px solid var(--adm-line)' }}>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
            {store.email}
          </span>
        </div>
        <button
          type="button"
          onClick={() => signOut(router)}
          className="adm-btn adm-btn-ghost adm-btn-sm"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut />
        </button>
      </div>
    </aside>
  )
}

export function DesktopTopBar({ store }: { store: NavStore }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() ?? ''
    if (!q) return
    // "#1042" o "1042" busca un pedido por número; cualquier otra cosa, un producto.
    if (/^#?\d+$/.test(q)) router.push(`/admin/pedidos?q=${encodeURIComponent(q.replace('#', ''))}`)
    else router.push(`/admin/productos?q=${encodeURIComponent(q)}`)
    inputRef.current?.blur()
  }

  return (
    <header
      className="sticky top-0 z-30 hidden h-16 items-center gap-3.5 px-7 backdrop-blur md:flex"
      style={{ backgroundColor: 'rgba(255,255,255,.88)', borderBottom: '1px solid var(--adm-line)' }}
    >
      <form
        onSubmit={onSubmit}
        className="flex max-w-[420px] flex-1 items-center gap-2 rounded-[10px] px-3 py-2"
        style={{ backgroundColor: 'var(--adm-bg)', border: '1px solid var(--adm-line)', color: 'var(--adm-soft)' }}
      >
        <Search className="h-[17px] w-[17px] flex-shrink-0" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Buscar productos o n.º de pedido…"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--adm-soft)]"
          style={{ color: 'var(--adm-ink)' }}
        />
        <kbd className="rounded-[5px] border bg-white px-1.5 font-sans text-[11px]" style={{ borderColor: 'var(--adm-line)' }}>
          Ctrl K
        </kbd>
      </form>
      <div className="flex-1" />
      {store.storeOnline && (
        <a href={`/${store.slug}`} target="_blank" rel="noreferrer" className="adm-btn">
          <ExternalLink />
          Ver mi tienda
        </a>
      )}
    </header>
  )
}

export function MobileTopBar({ store }: { store: NavStore }) {
  const pathname = usePathname()
  if (ROOTS.includes(pathname)) {
    return (
      <header
        className="sticky top-0 z-30 flex h-14 items-center gap-2.5 px-4 md:hidden"
        style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--adm-line)' }}
      >
        <StoreLogo name={store.name} logoUrl={store.logoUrl} size={30} />
        <b className="min-w-0 flex-1 truncate text-[15px]">{store.name}</b>
        {store.storeOnline && (
          <a
            href={`/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="adm-btn h-9 w-9 !p-0"
            aria-label="Ver mi tienda"
          >
            <ExternalLink />
          </a>
        )}
      </header>
    )
  }
  const { title, back } = subScreen(pathname)
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-2 px-2 md:hidden"
      style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--adm-line)' }}
    >
      <Link href={back} className="grid h-10 w-10 place-items-center" aria-label="Volver">
        <ArrowLeft className="h-[22px] w-[22px]" />
      </Link>
      <b className="min-w-0 flex-1 truncate text-[16px]">{title}</b>
    </header>
  )
}

export function MobileTabBar({ store }: { store: NavStore }) {
  const pathname = usePathname()
  if (!ROOTS.includes(pathname)) return null
  const tabs: (NavItem & { count?: number })[] = [
    MAIN[0],
    { ...MAIN[1], count: store.pendingOrders },
    MAIN[2],
    { href: '/admin/mas', label: 'Más', icon: Menu },
  ]
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex px-1.5 pt-1.5 md:hidden"
      style={{
        backgroundColor: '#fff',
        borderTop: '1px solid var(--adm-line)',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map((t) => {
        const active = isActive(pathname, t.href)
        const Icon = t.icon
        return (
          <Link
            key={t.href}
            href={t.href}
            className="relative flex flex-1 flex-col items-center gap-[3px] py-1 text-[11px]"
            style={{ color: active ? 'var(--adm-ink)' : 'var(--adm-soft)', fontWeight: active ? 600 : 400 }}
          >
            <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
            {t.label}
            {!!t.count && (
              <span
                className="absolute -top-0.5 left-[calc(50%+4px)] rounded-full px-[5px] text-[10px] font-semibold text-white"
                style={{ backgroundColor: 'var(--adm-accent)', border: '2px solid #fff' }}
              >
                {t.count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
