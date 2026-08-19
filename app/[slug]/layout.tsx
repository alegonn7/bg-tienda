import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStoreBySlug } from '@/lib/tenant'
import { CartProvider } from '@/components/cart-context'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) return {}

  const faviconUrl = store.faviconUrl ?? '/favicon.png'
  const title = store.storeName ?? store.organizationName

  return {
    title,
    icons: {
      icon: faviconUrl,
      apple: faviconUrl,
    },
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const store = await getStoreBySlug(slug)

  // Slug que no corresponde a ninguna tienda habilitada -> 404, igual que cualquier ruta
  // inexistente. Esto es lectura pública (el slug ya es información pública, ver Fase 04).
  if (!store) notFound()

  return (
    <div
      style={
        store.accentColor
          ? ({ '--color-accent': store.accentColor } as React.CSSProperties)
          : undefined
      }
    >
      {/* CartProvider por tienda (key=slug): si el visitante navega de una tienda a otra, el
          carrito no debe arrastrar productos de la tienda anterior. */}
      <CartProvider key={slug}>{children}</CartProvider>
    </div>
  )
}
