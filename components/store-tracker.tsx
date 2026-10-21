'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackStoreEvent } from '@/lib/track'

const PRODUCT_PATH = /\/productos\/([0-9a-f-]{36})(?:\/|$)/i

// Una visita por cada página que se abre en la tienda y, si es la de un producto, también
// "producto visto". Va en app/[slug]/layout.tsx, así cubre todas las páginas de la tienda.
export function StoreTracker({ organizationId }: { organizationId: string }) {
  const pathname = usePathname()
  useEffect(() => {
    if (!pathname) return
    trackStoreEvent(organizationId, 'page_view', { path: pathname })
    const product = PRODUCT_PATH.exec(pathname)
    if (product) trackStoreEvent(organizationId, 'product_view', { productId: product[1] })
  }, [organizationId, pathname])
  return null
}
