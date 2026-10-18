import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/site-shell'
import { Suspense } from 'react'
import { ProductsClient, ProductsFromUrl } from '@/components/products-client'
import { getProducts } from '@/lib/products-server'
import { getStoreBySlug } from '@/lib/tenant'
import { storeDisplayName } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) return {}

  const storeName = storeDisplayName(store)
  const title = `Productos | ${storeName}`
  const description = `Catálogo completo de ${storeName}: mirá todos los productos y hacé tu pedido online.`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/${slug}/productos` },
    openGraph: {
      title,
      description,
      url: `/${slug}/productos`,
      siteName: storeName,
      type: 'website',
      locale: 'es_AR',
      ...(store.logoUrl ? { images: [{ url: store.logoUrl, alt: storeName }] } : {}),
    },
  }
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) notFound()

  const products = await getProducts(store.organizationId)

  return (
    <SiteShell store={store}>
      {/* Mientras se leen ?categoria= y ?q= se muestra el catálogo completo, que es también lo
          que queda en el HTML cacheado (y lo que ven los buscadores). */}
      <Suspense fallback={<ProductsClient products={products} slug={slug} showPrices={store.showPrices} />}>
        <ProductsFromUrl products={products} slug={slug} showPrices={store.showPrices} />
      </Suspense>
    </SiteShell>
  )
}
