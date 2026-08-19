import { notFound } from 'next/navigation'
import { SiteShell, SectionLabel } from '@/components/site-shell'
import { ProductCard } from '@/components/product-card'
import { ProductPurchase } from '@/components/product-purchase'
import { getProduct, getProducts } from '@/lib/products-server'
import { productImage } from '@/lib/products'
import { getStoreBySlug } from '@/lib/tenant'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const store = await getStoreBySlug(slug)
  if (!store) notFound()

  const [product, allProducts] = await Promise.all([
    getProduct(store.organizationId, id),
    getProducts(store.organizationId),
  ])

  if (!product) notFound()

  const related = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 3)

  return (
    <SiteShell store={store}>
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[55fr_45fr]">
          {/* Left: image */}
          <div
            className="aspect-square w-full overflow-hidden"
            style={{
              backgroundColor: '#f5f5f3',
              border: '1px solid #e5e5e5',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImage(product) || '/placeholder.jpg'}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Right: info */}
          <div className="lg:pl-6">
            <p
              className="text-[12px] uppercase"
              style={{ letterSpacing: '0.08em', color: '#6b6b6b' }}
            >
              {product.category}
            </p>
            <h1
              className="mt-3 text-[32px] font-medium leading-tight md:text-[36px]"
              style={{ color: '#111111' }}
            >
              {product.name}
            </h1>
            <div
              className="my-6"
              style={{ borderTop: '1px solid #e5e5e5' }}
            />
            <p className="text-[15px]" style={{ color: '#6b6b6b' }}>
              {product.description}
            </p>
            <p
              className="mt-4 text-[13px] italic"
              style={{ color: '#6b6b6b' }}
            >
              Personalizá con tu logo o imagen
            </p>
            <div
              className="my-6"
              style={{ borderTop: '1px solid #e5e5e5' }}
            />
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <p
                  className="mb-3 text-[13px] uppercase"
                  style={{ letterSpacing: '0.02em', color: '#6b6b6b' }}
                >
                  Medidas disponibles
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className="px-3 py-1.5 text-[13px]"
                      style={{ border: '1px solid #e5e5e5', color: '#111111' }}
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <ProductPurchase product={product} store={store} />
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-24">
            <SectionLabel>También te puede interesar</SectionLabel>
            <div
              className="mt-4 mb-10"
              style={{ borderTop: '1px solid #e5e5e5' }}
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} slug={slug} />
              ))}
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  )
}
