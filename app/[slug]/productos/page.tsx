import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/site-shell'
import { ProductsClient } from '@/components/products-client'
import { getProducts } from '@/lib/products-server'
import { getStoreBySlug } from '@/lib/tenant'

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
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <ProductsClient products={products} slug={slug} showPrices={store.showPrices} />
      </section>
    </SiteShell>
  )
}
