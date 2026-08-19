import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/site-shell'
import { ProductCard } from '@/components/product-card'
import { getProducts, getFeaturedProducts } from '@/lib/products-server'
import { FeaturedCarousel } from '@/components/featured-carousel'
import { HeroSlider } from '@/components/hero-slider'
import { getStoreBySlug } from '@/lib/tenant'
import { createClient } from '@/lib/supabase/server'

const features = [
  {
    label: 'Diseño personalizado',
    text: 'Con tu logo o imagen',
    icon: (
      <svg width="22" height="22" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.032 2.032 0 1 1 2.872 2.872L7.5 19.613l-4 1 1-4 12.362-12.126z" />
      </svg>
    ),
  },
  {
    label: 'Producción local',
    text: 'Fabricación argentina',
    icon: (
      <svg width="22" height="22" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z" />
      </svg>
    ),
  },
  {
    label: 'Envíos a todo el país',
    text: 'Correo o puerta a puerta',
    icon: (
      <svg width="22" height="22" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    label: 'Sin mínimo fijo',
    text: 'Consultá tu cantidad',
    icon: (
      <svg width="22" height="22" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
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
            Tus pins,
            <br />
            a tu manera.
          </h1>
          <p className="mt-6 max-w-[480px] mx-auto text-[16px]" style={{ color: '#333333' }}>
            Pins personalizados en todos los formatos: llaveros,
            imanes, destapadores y más. Envíos a todo el país.
          </p>
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
          <FeaturedCarousel products={featured} slug={slug} />
        </section>
      )}

      {/* Features strip */}
      <section style={{ borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', backgroundColor: '#ffffff' }}>
        <div className="mx-auto max-w-[1200px] px-6 py-14 grid grid-cols-2 gap-8 md:grid-cols-4">
          {features.map((f) => (
            <div key={f.label} className="flex flex-col gap-3">
              <div>{f.icon}</div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium" style={{ color: '#111111' }}>{f.label}</span>
                <span className="text-[13px]" style={{ color: '#6b6b6b' }}>{f.text}</span>
              </div>
            </div>
          ))}
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
              <ProductCard key={product.id} product={product} slug={slug} />
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
