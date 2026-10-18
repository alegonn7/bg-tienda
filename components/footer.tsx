import Link from 'next/link'
import { CreditCard, Landmark, MessageCircle } from 'lucide-react'
import { StoreBrand } from '@/components/navbar'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '@/components/store/icons'
import { categoryLabel } from '@/lib/products'
import { paymentLabels, storeName, whatsappUrl } from '@/lib/store-info'
import type { Store } from '@/lib/tenant'

const PAY_ICON: Record<string, typeof CreditCard> = {
  'Mercado Pago': CreditCard,
  Transferencia: Landmark,
  'Pedido por WhatsApp': MessageCircle,
}

export function Footer({ store, categories }: { store: Store; categories: string[] }) {
  const base = `/${store.slug}`
  const wa = whatsappUrl(store)
  const pays = paymentLabels(store)
  const hasContact = !!(wa || store.instagramUrl || store.facebookUrl)

  return (
    <footer className="mt-12 border-t pb-7 pt-9 text-[14px] md:mt-20 md:pt-[52px]" style={{ borderColor: 'var(--st-line)' }}>
      <div className="st-wrap">
        <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-8">
          <div className="sm:col-span-2 md:col-span-1">
            <StoreBrand store={store} compact />
            {store.heroSubtitle && (
              <p className="mt-3 max-w-[300px]" style={{ color: 'var(--st-mut)' }}>
                {store.heroSubtitle}
              </p>
            )}
            {(store.instagramUrl || store.facebookUrl || wa) && (
              <div className="mt-4 flex gap-2">
                {store.instagramUrl && (
                  <a href={store.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-[38px] w-[38px] place-items-center rounded-full border" style={{ borderColor: 'var(--st-line)' }}>
                    <InstagramIcon />
                  </a>
                )}
                {store.facebookUrl && (
                  <a href={store.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid h-[38px] w-[38px] place-items-center rounded-full border" style={{ borderColor: 'var(--st-line)' }}>
                    <FacebookIcon />
                  </a>
                )}
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-[38px] w-[38px] place-items-center rounded-full border" style={{ borderColor: 'var(--st-line)' }}>
                    <WhatsAppIcon size={17} />
                  </a>
                )}
              </div>
            )}
          </div>
          <div className={hasContact || pays.length ? '' : 'sm:col-span-2'}>
            <h4 className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--st-mut)' }}>
              Tienda
            </h4>
            <ul className="grid gap-2.5" style={{ color: 'var(--st-ink2)' }}>
              <li>
                <Link href={`${base}/productos`} className="hover:underline">
                  Todos los productos
                </Link>
              </li>
              {categories.slice(0, 6).map((c) => (
                <li key={c}>
                  <Link href={`${base}/productos?categoria=${encodeURIComponent(c)}`} className="hover:underline">
                    {categoryLabel(c)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {(hasContact || pays.length > 0) && (
            <div>
              {wa && (
                <>
                  <h4 className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--st-mut)' }}>
                    Contacto
                  </h4>
                  <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline" style={{ color: 'var(--st-ink2)' }}>
                    <MessageCircle className="h-4 w-4" style={{ color: 'var(--st-soft)' }} />
                    Escribinos por WhatsApp
                  </a>
                </>
              )}
              {pays.length > 0 && (
                <>
                  <h4 className={`mb-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] ${wa ? 'mt-6' : ''}`} style={{ color: 'var(--st-mut)' }}>
                    Medios de pago
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {pays.map((p) => {
                      const Icon = PAY_ICON[p] ?? CreditCard
                      return (
                        <span key={p} className="inline-flex h-[34px] items-center whitespace-nowrap gap-1.5 rounded-lg border px-3 text-[13px] font-semibold" style={{ borderColor: 'var(--st-line)' }}>
                          <Icon className="h-4 w-4" />
                          {p}
                        </span>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="mt-8 flex flex-col gap-1.5 border-t pt-5 text-[13px] md:mt-10 md:flex-row md:justify-between" style={{ borderColor: 'var(--st-line2)', color: 'var(--st-soft)' }}>
          <span>
            © {new Date().getFullYear()} {storeName(store)}
          </span>
          <Link href="/admin/login" className="hover:underline">
            Acceso vendedor
          </Link>
        </div>
      </div>
    </footer>
  )
}
