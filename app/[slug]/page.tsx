import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/site-shell'
import { ProductCard } from '@/components/product-card'
import { getProducts, getFeaturedProducts } from '@/lib/products-server'
import { FeaturedCarousel } from '@/components/featured-carousel'
import { HeroSlider } from '@/components/hero-slider'
import { getStoreBySlug } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'
import { FEATURE_ICONS } from '@/lib/feature-icons'
import { Sparkles } from 'lucide-react'

const DEFAULT_FEATURES = [
  { title: 'Tu marca', text: 'Productos con tu identidad', icon: 'tag' },
  { title: 'Atención directa', text: 'Coordinás todo por WhatsApp', icon: 'chat' },
  { title: 'Fácil de pedir', text: 'Elegís, consultás y listo', icon: 'check' },
]

export default async function HomePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) notFound()

  const supabase = await createClient()
  const [products, featured, { data: heroData }] = await Promise.all([
    getProducts(store.organizationId),
    getFeaturedProducts(store.organizationId),
    supabase
      .from('hero_images')
      .select('url')
      .eq('organization_id', store.organizationId)
      .order('position'),
  ])
  const preview = products.slice(0, 3)
  const heroImages = (heroData ?? []).map((h) => h.url)
  const hasHero = heroImages.length > 0
  const brandName = store.storeName ?? store.organizationName
  const waMessage = store.whatsappMessageTemplate ?? `Hola ${brandName}! Quiero consultar sobre un proyecto.`
  const waUrl = store.whatsappNumber
    ? `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(waMessage)}`
    : null
  const features = store.features.length > 0 ? store.features : DEFAULT_FEATURES

  return (
    <SiteShell store={store}>

      {/* Hero */}
      <section
        className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center"
        style={{ overflow: 'hidden' }}
      >
        <HeroSlider images={heroImages} />
        <div
          className="relative z-10 px-12 py-14"
          style={hasHero ? { backgroundColor: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)' } : {}}
        >
          <span className="mb-10 block h-px w-10 mx-auto" style={{ backgroundColor: 'var(--color-accent)' }} aria-hidden="true" />
          <h1 className="text-balance text-[44px] font-medium leading-[1.1] sm:text-[56px] md:text-[64px]" style={{ color: '#111111' }}>
            {store.heroTitle || `Bienvenido a ${brandName}`}
          </h1>
          {store.heroSubtitle && (
            <p className="mt-6 max-w-[480px] mx-auto text-[16px]" style={{ color: '#333333' }}>
              {store.heroSubtitle}
            </p>
          )}
          <Link href={`/${slug}/productos`} className="pc-btn mt-10 px-6 py-3 text-[14px]">
            Ver productos →
          </Link>
        </div>
      </section>

      {/* Más vendidos */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="flex items-baseline justify-between mb-10" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '20px' }}>
            <h2 className="text-[22px] font-medium" style={{ color: '#111111' }}>
              Más vendidos
            </h2>
          </div>
          <FeaturedCarousel products={featured} slug={slug} showPrices={store.showPrices} />
        </section>
      )}

      {/* Features strip */}
      <section style={{ borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', backgroundColor: '#ffffff' }}>
        <div className="mx-auto max-w-[1200px] px-6 py-14 flex flex-wrap justify-center gap-x-16 gap-y-8">
          {features.map((f) => {
            const Icon = (f.icon && FEATURE_ICONS[f.icon]) || Sparkles
            return (
              <div key={f.title} className="flex w-[220px] flex-col items-center gap-3 text-center">
                <Icon size={22} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium" style={{ color: '#111111' }}>{f.title}</span>
                  <span className="text-[13px]" style={{ color: '#6b6b6b' }}>{f.text}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Productos */}
      <section className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="flex items-baseline justify-between mb-10" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '20px' }}>
          <h2 className="text-[22px] font-medium" style={{ color: '#111111' }}>
            Productos
          </h2>
          <Link href={`/${slug}/productos`} className="text-[13px]" style={{ color: '#6b6b6b' }}>
            Ver todos →
          </Link>
        </div>
        {preview.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {preview.map((product) => (
              <ProductCard key={product.id} product={product} slug={slug} showPrices={store.showPrices} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-[14px]" style={{ color: '#6b6b6b' }}>
            Próximamente.
          </p>
        )}
      </section>

      {/* Contacto */}
      <section style={{ borderTop: '1px solid #e5e5e5' }}>
        <div className="mx-auto max-w-[1200px] px-6 py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[20px] font-medium" style={{ color: '#111111' }}>
              ¿Tenés un proyecto?
            </p>
            <p className="mt-1 text-[14px]" style={{ color: '#6b6b6b' }}>
              Escribinos y te respondemos con un presupuesto sin compromiso.
            </p>
          </div>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="pc-btn shrink-0 px-6 py-3 text-[14px]"
            >
              Consultar por WhatsApp →
            </a>
          )}
        </div>
      </section>

    </SiteShell>
  )
}
