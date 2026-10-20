import Link from 'next/link'
import { CreditCard, Landmark, MessageCircle } from 'lucide-react'
import { StoreBrand } from '@/components/navbar'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '@/components/store/icons'
import { categoryLabel } from '@/lib/products'
import { paymentLabels, storeName, whatsappUrl } from '@/lib/store-info'
import type { Store } from '@/lib/tenant'
import { BINARY_GOATS_URL } from '@/lib/site-config'

const PAY_ICON: Record<string, typeof CreditCard> = {
  'Mercado Pago': CreditCard,
  Transferencia: Landmark,
  'Pedido por WhatsApp': MessageCircle,
}

export function Footer({ store, categories }: { store: Store; categories: string[] }) {
  const base = `/${store.slug}`
  const wa = whatsappUrl(store)
  const pays = paymentLabels(store)

  // Pocas categorías (las que más productos tienen): el pie no es el catálogo.
  const topCategories = categories.slice(0, 3)
  // WhatsApp ya está en Contacto: en medios de pago solo van los de cobro.
  const payMethods = pays.filter((p) => p !== 'Pedido por WhatsApp')
  const h4 = 'mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] md:mb-3.5 md:text-[13px]'

  return (
    <footer className="mt-12 border-t pb-24 pt-8 text-[14px] md:mt-20 md:pb-7 md:pt-[52px]" style={{ borderColor: 'var(--st-line)' }}>
      <div className="st-wrap">
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-8">
          <div className="col-span-2 flex items-start justify-between gap-4 md:col-span-1 md:block">
            <div className="min-w-0">
              <StoreBrand store={store} compact />
              {store.heroSubtitle && (
                <p className="mt-2 max-w-[300px] md:mt-3" style={{ color: 'var(--st-mut)' }}>
                  {store.heroSubtitle}
                </p>
              )}
            </div>
            {(store.instagramUrl || store.facebookUrl || wa) && (
              <div className="flex flex-shrink-0 gap-2 md:mt-4">
                {store.instagramUrl && (
                  <a href={store.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-full border md:h-[38px] md:w-[38px]" style={{ borderColor: 'var(--st-line)' }}>
                    <InstagramIcon />
                  </a>
                )}
                {store.facebookUrl && (
                  <a href={store.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full border md:h-[38px] md:w-[38px]" style={{ borderColor: 'var(--st-line)' }}>
                    <FacebookIcon />
                  </a>
                )}
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full border md:h-[38px] md:w-[38px]" style={{ borderColor: 'var(--st-line)' }}>
                    <WhatsAppIcon size={17} />
                  </a>
                )}
              </div>
            )}
          </div>
          <div className={wa || payMethods.length ? 'min-w-0' : 'col-span-2 md:col-span-1'}>
            <h4 className={h4} style={{ color: 'var(--st-mut)' }}>
              Tienda
            </h4>
            <ul className="grid gap-2 md:gap-2.5" style={{ color: 'var(--st-ink2)' }}>
              <li>
                <Link href={`${base}/productos`} className="hover:underline">
                  Todos los productos
                </Link>
              </li>
              {topCategories.map((c) => (
                <li key={c} className="break-words">
                  <Link href={`${base}/productos?categoria=${encodeURIComponent(c)}`} className="hover:underline">
                    {categoryLabel(c).replace(/\//g, '/\u200b')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {(wa || payMethods.length > 0) && (
            <div className="min-w-0">
              {wa && (
                <>
                  <h4 className={h4} style={{ color: 'var(--st-mut)' }}>
                    Ayuda
                  </h4>
                  <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline" style={{ color: 'var(--st-ink2)' }}>
                    <MessageCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--st-soft)' }} />
                    Escribinos
                  </a>
                </>
              )}
              {payMethods.length > 0 && (
                <>
                  <h4 className={`${h4} ${wa ? 'mt-5 md:mt-6' : ''}`} style={{ color: 'var(--st-mut)' }}>
                    Pagos
                  </h4>
                  <ul className="grid gap-2" style={{ color: 'var(--st-ink2)' }}>
                    {payMethods.map((p) => {
                      const Icon = PAY_ICON[p] ?? CreditCard
                      return (
                        <li key={p} className="flex items-center gap-2">
                          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--st-soft)' }} />
                          {p}
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t pt-4 text-[13px] md:mt-10 md:pt-5" style={{ borderColor: 'var(--st-line2)', color: 'var(--st-soft)' }}>
          <span>
            © {new Date().getFullYear()} {storeName(store)}
          </span>
          <Link href="/admin/login" className="hover:underline">
            Acceso vendedor
          </Link>
        </div>
        {/* Invitación discreta para otros negocios + crédito de Binary Goats. */}
        <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--st-soft)' }}>
          ¿Tenés un negocio?{' '}
          <Link href="/" className="underline underline-offset-2 hover:opacity-70">
            Creá tu tienda online
          </Link>
          {' · '}
          <span className="whitespace-nowrap">
            Hecha por{' '}
            <a href={BINARY_GOATS_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:opacity-70">
              Binary Goats
            </a>
          </span>
        </p>
      </div>
    </footer>
  )
}
