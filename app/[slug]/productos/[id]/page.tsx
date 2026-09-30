import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteShell, SectionLabel } from '@/components/site-shell'
import { ProductCard } from '@/components/product-card'
import { ProductPurchase } from '@/components/product-purchase'
import { getProduct, getProducts } from '@/lib/products-server'
import { productImage } from '@/lib/products'
import { getStoreBySlug } from '@/lib/tenant'
import { formatPrice } from '@/lib/format'
import { SITE_URL } from '@/lib/site-config'
import { absoluteUrl, metaDescription, storeDisplayName } from '@/lib/seo'

// Cada producto se renderiza la primera vez que alguien lo visita y queda cacheado (ISR, ver
// app/[slug]/layout.tsx).
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ slug: string; id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, id } = await params
  const store = await getStoreBySlug(slug)
  if (!store) return {}
  const product = await getProduct(store.organizationId, id)
  if (!product) return {}

  const storeName = storeDisplayName(store)
  const title = `${product.name} | ${storeName}`
  const price = store.showPrices && product.price != null ? ` a ${formatPrice(product.price)}` : ''
  const description = metaDescription(
    product.description?.trim()
      ? product.description
      : `Comprá ${product.name}${price} en ${storeName}.${product.category ? ` ${product.category}.` : ''} Pedidos online con envío o retiro.`,
  )
  const url = `/${slug}/productos/${product.id}`
  const images = product.images.length > 0 ? [{ url: absoluteUrl(product.images[0]), alt: product.name }] : undefined

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: storeName,
      type: 'website',
      locale: 'es_AR',
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images?.map((i) => i.url),
    },
  }
}

// Datos estructurados de producto. Solo se publican si la página muestra el precio: Google exige
// "offers" (o reseñas) en un Product, y marcar un precio que el visitante no ve va contra sus
// reglas. Las tiendas que ocultan precios quedan sin este bloque, pero con título/description.
function productJsonLd(product: NonNullable<Awaited<ReturnType<typeof getProduct>>>, storeName: string, url: string) {
  const availability =
    product.stock == null
      ? undefined
      : product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description?.trim() ? { description: product.description.trim() } : {}),
    ...(product.images.length > 0 ? { image: product.images.map(absoluteUrl) } : {}),
    ...(product.category ? { category: product.category } : {}),
    sku: product.id,
    brand: { '@type': 'Brand', name: storeName },
    offers: {
      '@type': 'Offer',
      url,
      price: product.price,
      priceCurrency: 'ARS',
      ...(availability ? { availability } : {}),
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: storeName },
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const store = await getStoreBySlug(slug)
  if (!store) notFound()

  // Para "relacionados" alcanzan 4 (3 + el propio producto, que se filtra) — no hace falta
  // traer el catálogo entero.
  const [product, latest] = await Promise.all([
    getProduct(store.organizationId, id),
    getProducts(store.organizationId, 4),
  ])

  if (!product) notFound()

  const related = latest
    .filter((p) => p.id !== product.id)
    .slice(0, 3)

  const jsonLd =
    store.showPrices && product.price != null
      ? productJsonLd(product, storeDisplayName(store), `${SITE_URL}/${slug}/productos/${product.id}`)
      : null

  return (
    <SiteShell store={store}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
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
            {store.showPrices && product.price != null && (
              <p className="mt-3 text-[22px] font-medium" style={{ color: '#111111' }}>
                {formatPrice(product.price)}
              </p>
            )}
            <div
              className="my-6"
              style={{ borderTop: '1px solid #e5e5e5' }}
            />
            <p className="text-[15px]" style={{ color: '#6b6b6b' }}>
              {product.description}
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
                  Tamaños disponibles
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
