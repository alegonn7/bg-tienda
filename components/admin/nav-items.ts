import {
  CreditCard,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  Palette,
  Ruler,
  Settings,
  ShoppingBag,
  Tags,
} from 'lucide-react'

// Las secciones del menú. Van en un módulo sin 'use client' para que también las pueda leer una
// página de servidor (la pantalla Más): importadas desde admin-nav.tsx llegarían como referencia
// de cliente y no como array.

export type NavItem = { href: string; label: string; icon: typeof Package }

export const MAIN: NavItem[] = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/productos', label: 'Productos', icon: Package },
]

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Catálogo',
    items: [
      { href: '/admin/categorias', label: 'Categorías', icon: Tags },
      { href: '/admin/tamanos', label: 'Tamaños', icon: Ruler },
    ],
  },
  {
    title: 'Mi tienda',
    items: [
      { href: '/admin/hero', label: 'Banner', icon: ImageIcon },
      { href: '/admin/personalizacion', label: 'Apariencia', icon: Palette },
      { href: '/admin/configuracion', label: 'Pagos y envíos', icon: Settings },
    ],
  },
]

export const SUSCRIPCION: NavItem = { href: '/admin/suscripcion', label: 'Mi suscripción', icon: CreditCard }

