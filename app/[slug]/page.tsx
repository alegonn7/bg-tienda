import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { ProductCard } from '@/components/product-card'
import { FeaturedCarousel } from '@/components/featured-carousel'
import { HeroSlider } from '@/components/hero-slider'
import { BENEFIT_ICONS, WhatsAppIcon } from '@/components/store/icons'
import { getFeaturedProducts, getProducts, getStoreCategories } from '@/lib/products-server'
import { getStoreBySlug } from '@/lib/tenant'
import { createPublicClient } from '@/lib/supabase/public'
import { FEATURE_ICONS } from '@/lib/feature-icons'
import { categoryLabel } from '@/lib/products'
import { storeBenefits, storeName, whatsappUrl } from '@/lib/store-info'

// Título, description y Open Graph vienen de app/[slug]/layout.tsx; acá solo el canonical, que
// no puede ir en el layout porque lo heredarían /productos y cada producto.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { alternates: { canonical: `/${slug}` } }
}

export default async function HomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) notFound()

  const supabase = createPublicClient()
  const [latest, featured, categories, { data: heroData, error: heroError }] = await Promise.all([
    getProducts(store.organizationId, 8),
    getFeaturedProducts(store.organizationId),
    getStoreCategories(store.organizationId),
    supabase.from('hero_images').select('url').eq('organization_id', store.organizationId).order('position'),
  ])
  // Error de Supabase -> lanzar, para no cachear (ISR) la home sin banner.
  if (heroError) throw new Error(`hero_images: ${heroError.message}`)
  const heroImages = (heroData ?? []).map((h) => h.url)
  const name = storeName(store)
  const wa = whatsappUrl(store)
  const base = `/${slug}`

  // Los puntos de la franja los elige el dueño en Apariencia; si no cargó ninguno, se arman
  // solos según lo que la tienda tiene activado.
  const benefits = store.features.length
    ? store.features.map((f) => ({ Icon: (f.icon && FEATURE_ICONS[f.icon]) || Sparkles, title: f.title, text: f.text }))
    : storeBenefits(store).map((b) => ({ Icon: BENEFIT_ICONS[b.icon], title: b.title, text: b.text }))

  return (
    <SiteShell store={store}>
      {/* Portada */}
      <section
        className="relative flex h-[480px] overflow-hidden md:h-[560px]"
        style={{ background: 'linear-gradient(135deg, #1d1a22 0%, #2a1a2a 45%, var(--color-accent) 130%)' }}
      >
        <HeroSlider images={heroImages} />
        <div className="st-wrap relative z-[1] flex flex-col justify-end pb-14 text-white md:justify-center md:pb-0">
          <div className="max-w-[580px]">
            <h1 className="text-balance text-[36px] font-bold leading-[1.05] tracking-[-0.022em] md:text-[58px]">
              {store.heroTitle || `Bienvenido a ${name}`}
            </h1>
            {store.heroSubtitle && <p className="mt-3 max-w-[460px] text-[15px] opacity-90 md:mt-4 md:text-[18px]">{store.heroSubtitle}</p>}
            <div className="mt-6 flex gap-3 md:mt-8">
              <Link href={`${base}/productos`} className="st-btn st-btn-pri st-btn-lg flex-1 md:flex-none">
                Ver productos
                <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      {categories.length > 1 && (
        <section className="st-wrap pt-10 md:pt-16">
          <div className="mb-4 flex items-end justify-between gap-4 md:mb-[22px]">
            <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[28px]">Comprá por categoría</h2>
            <Link href={`${base}/productos`} className="inline-flex items-center gap-1.5 whitespace-nowrap text-[14px] font-semibold">
              Ver todo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div
            style={{ '--n': Math.min(categories.length, 5) } as React.CSSProperties}
            className="st-noscroll -mr-4 flex gap-2.5 overflow-x-auto pr-4 md:mr-0 md:grid md:grid-cols-[repeat(var(--n),minmax(0,1fr))] md:gap-4 md:overflow-visible md:pr-0">
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.name}
                href={`${base}/productos?categoria=${encodeURIComponent(c.name)}`}
                className="relative h-[156px] w-[140px] flex-shrink-0 overflow-hidden rounded-[14px] md:aspect-[1/1.08] md:h-auto md:w-auto md:rounded-[18px]"
                style={{ backgroundColor: 'var(--st-sf)' }}
              >
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden className="grid h-full place-items-center pb-12 text-[44px] font-bold md:text-[64px]" style={{ color: 'var(--st-line)' }}>
                    {categoryLabel(c.name).charAt(0)}
                  </span>
                )}
                <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-[9px] bg-white px-2.5 py-2 text-[13px] font-semibold leading-tight md:inset-x-3.5 md:bottom-3.5 md:rounded-xl md:px-3 md:py-2.5 md:text-[15px]">
                  <span className="line-clamp-2 min-w-0 [overflow-wrap:anywhere]">{categoryLabel(c.name)}</span>
                  <small className="hidden text-[13px] font-medium md:inline" style={{ color: 'var(--st-mut)' }}>
                    {c.count}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <FeaturedCarousel title="Más vendidos" subtitle="Lo que más se llevan nuestros clientes" products={featured} slug={slug} showPrices={store.showPrices} />

      {/* Beneficios */}
      {benefits.length > 0 && (
        <section className="mt-11 md:mt-[72px]" style={{ backgroundColor: 'var(--st-sf)' }}>
          <div className={`st-wrap grid grid-cols-2 gap-x-3.5 gap-y-[18px] py-6 md:gap-6 md:py-[34px] ${benefits.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
            {benefits.slice(0, 4).map(({ Icon, title, text }) => (
              <div key={title} className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3.5">
                <span className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-xl bg-white md:h-11 md:w-11">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span>
                  <b className="block text-[14px] md:text-[15px]">{title}</b>
                  <small className="mt-0.5 block text-[12px] md:text-[13px]" style={{ color: 'var(--st-mut)' }}>
                    {text}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Novedades */}
      <section className="st-wrap pt-10 md:pt-16">
        <div className="mb-4 flex items-end justify-between gap-4 md:mb-[22px]">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[28px]">Novedades</h2>
            <p className="mt-1 text-[14px] md:text-[15px]" style={{ color: 'var(--st-mut)' }}>
              Lo último que llegó a la tienda
            </p>
          </div>
          <Link href={`${base}/productos`} className="inline-flex items-center gap-1.5 whitespace-nowrap text-[14px] font-semibold">
            Ver todo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {latest.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-[22px] md:grid-cols-4 md:gap-x-5 md:gap-y-7">
              {latest.map((p) => (
                <ProductCard key={p.id} product={p} slug={slug} showPrices={store.showPrices} />
              ))}
            </div>
            <div className="mt-9 text-center">
              <Link href={`${base}/productos`} className="st-btn">
                Ver todos los productos
              </Link>
            </div>
          </>
        ) : (
          <p className="py-16 text-center text-[15px]" style={{ color: 'var(--st-mut)' }}>
            Próximamente.
          </p>
        )}
      </section>

      {/* Ayuda por WhatsApp */}
      {wa && (
        <section className="st-wrap mt-11 md:mt-[72px]">
          <div className="flex flex-col items-start gap-4 rounded-[20px] px-[22px] py-[26px] text-white md:flex-row md:items-center md:gap-7 md:rounded-3xl md:px-12 md:py-10" style={{ backgroundColor: 'var(--st-ink)' }}>
            <div>
              <h3 className="text-[21px] font-bold tracking-[-0.02em] md:text-[26px]">¿Tenés dudas con tu compra?</h3>
              <p className="mt-1.5 opacity-75">Escribinos y te ayudamos a elegir, con el envío o con la forma de pago.</p>
            </div>
            <a href={wa} target="_blank" rel="noreferrer" className="st-btn st-btn-lg w-full md:ml-auto md:w-auto" style={{ backgroundColor: 'var(--st-wa)', borderColor: 'var(--st-wa)', color: '#fff' }}>
              <WhatsAppIcon />
              Escribinos por WhatsApp
            </a>
          </div>
        </section>
      )}
    </SiteShell>
  )
}
