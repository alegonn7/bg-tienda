import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Landmark, Minus, Plus, ShieldCheck, Store as StoreIcon, Truck } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { FeaturedCarousel } from '@/components/featured-carousel'
import { ProductGallery } from '@/components/product-gallery'
import { ProductPurchase } from '@/components/product-purchase'
import { getProduct, getProducts } from '@/lib/products-server'
import { hasDiscount } from '@/lib/products'
import { getStoreBySlug, type Store } from '@/lib/tenant'
import { freeShippingFrom, paymentLabels, pickupText } from '@/lib/store-info'
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

  const [product, all] = await Promise.all([getProduct(store.organizationId, id), getProducts(store.organizationId)])
  if (!product) notFound()

  // Relacionados: primero los de la misma categoría, después el resto.
  const others = all.filter((p) => p.id !== product.id)
  const related = [...others.filter((p) => p.category === product.category), ...others.filter((p) => p.category !== product.category)].slice(0, 8)

  const jsonLd =
    store.showPrices && product.price != null
      ? productJsonLd(product, storeDisplayName(store), `${SITE_URL}/${slug}/productos/${product.id}`)
      : null
  const priced = store.showPrices && product.price != null
  const base = `/${slug}`

  const freeFrom = freeShippingFrom(store)
  const perks = [
    store.shippingEnabled && {
      Icon: Truck,
      title: 'Envío a domicilio',
      text: `${freeFrom ? `Gratis desde ${formatPrice(freeFrom)}. ` : 'A todo el país. '}Calculás el costo con tu código postal al finalizar la compra.`,
    },
    { Icon: StoreIcon, title: 'Retiro sin cargo en el local', text: pickupText(store) ?? 'Pasás a buscar tu pedido por el local.' },
    store.showPrices && store.mercadopagoAvailable
      ? { Icon: ShieldCheck, title: 'Compra protegida', text: 'Pagás seguro con Mercado Pago' + (store.transferEnabled ? ' o por transferencia.' : '.') }
      : store.showPrices && store.transferEnabled
        ? { Icon: Landmark, title: 'Pago por transferencia', text: 'Te mostramos el alias al confirmar el pedido.' }
        : null,
  ].filter(Boolean) as { Icon: typeof Truck; title: string; text: string }[]

  return (
    <SiteShell store={store} hasBottomBar>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <div className="st-wrap pb-24 md:pb-0">
        <nav aria-label="Ubicación" className="hidden items-center gap-2 pt-6 text-[13px] md:flex" style={{ color: 'var(--st-mut)' }}>
          <Link href={base} className="hover:underline">Inicio</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`${base}/productos`} className="hover:underline">Productos</Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`${base}/productos?categoria=${encodeURIComponent(product.category)}`} className="hover:underline">
                {product.category}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate" style={{ color: 'var(--st-ink)' }}>{product.name}</span>
        </nav>

        <div className="md:mt-5 md:grid md:grid-cols-[1.15fr_1fr] md:gap-10 lg:gap-14">
          <div className="md:self-start">
            <ProductGallery product={product} />
          </div>

          <div className="pt-4 md:pt-0">
            {product.category && (
              <p className="text-[14px]" style={{ color: 'var(--st-mut)' }}>
                {product.category}
              </p>
            )}
            <h1 className="mt-1 text-[25px] font-bold leading-[1.1] tracking-[-0.02em] md:mt-1.5 md:text-[34px]">{product.name}</h1>
            <div className="mt-2.5 md:mt-3.5">
              {priced ? (
                <>
                  <p className="flex flex-wrap items-baseline gap-x-3 text-[25px] font-bold tracking-[-0.01em] md:text-[30px]">
                    {formatPrice(product.price)}
                    {hasDiscount(product) && (
                      <span className="text-[17px] font-medium line-through" style={{ color: 'var(--st-soft)' }}>
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    )}
                  </p>
                  {paymentLabels(store).length > 0 && (
                    <p className="mt-0.5 text-[14px]" style={{ color: 'var(--st-mut)' }}>
                      {paymentText(store)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[18px] font-semibold">Consultá precio</p>
              )}
            </div>

            <ProductPurchase product={product} store={store} />

            {perks.length > 0 && (
              <div className="mt-6 rounded-2xl border" style={{ borderColor: 'var(--st-line)' }}>
                {perks.map(({ Icon, title, text }, i) => (
                  <div key={title} className="flex items-start gap-3.5 px-[18px] py-[15px]" style={i ? { borderTop: '1px solid var(--st-line2)' } : undefined}>
                    <Icon className="mt-0.5 h-[18px] w-[18px] flex-shrink-0" style={{ color: 'var(--st-ink2)' }} strokeWidth={1.8} />
                    <div>
                      <b className="block text-[14px]">{title}</b>
                      <small className="block text-[13px]" style={{ color: 'var(--st-mut)' }}>{text}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {product.description?.trim() && (
              <details open className="group mt-6 border-y" style={{ borderColor: 'var(--st-line)' }}>
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  Descripción
                  <Plus className="h-[18px] w-[18px] group-open:hidden" />
                  <Minus className="hidden h-[18px] w-[18px] group-open:block" />
                </summary>
                <p className="whitespace-pre-line pb-[18px] text-[14px] leading-relaxed" style={{ color: 'var(--st-ink2)' }}>
                  {product.description}
                </p>
              </details>
            )}
          </div>
        </div>
      </div>

      <FeaturedCarousel title="También te puede gustar" products={related} slug={slug} showPrices={store.showPrices} />
    </SiteShell>
  )
}

function paymentText(store: Store): string {
  const pays = paymentLabels(store).filter((p) => p !== 'Pedido por WhatsApp')
  if (pays.length === 0) return 'Coordinás el pago por WhatsApp'
  return `Pagás con ${pays.join(' o ').replace('Transferencia', 'transferencia')}`
}
