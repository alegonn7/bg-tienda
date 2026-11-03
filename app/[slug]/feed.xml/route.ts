import { getStoreBySlug } from '@/lib/tenant'
import { getProducts } from '@/lib/products-server'
import { merchantFeedXml } from '@/lib/merchant-feed'

// Feed de Google Merchant Center de cada tienda: /{slug}/feed.xml (ver lib/merchant-feed.ts).
// Google lo descarga como "feed programado" (una vez por día como mucho), así que se cachea y se
// regenera cada hora; los cambios desde /admin también lo invalidan (revalidateStorefront).
export const dynamic = 'force-static'
export const revalidate = 3600

// Ninguna tienda se genera en el build: cada feed se arma la primera vez que se pide y queda en caché.
export function generateStaticParams() {
  return []
}

export async function GET(_req: Request, ctx: RouteContext<'/[slug]/feed.xml'>) {
  const { slug } = await ctx.params
  const store = await getStoreBySlug(slug)
  if (!store) return new Response('Tienda no encontrada', { status: 404 })

  const products = await getProducts(store.organizationId)
  return new Response(merchantFeedXml(store, products), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
