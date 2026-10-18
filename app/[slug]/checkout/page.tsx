import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChevronRight, Lock } from 'lucide-react'
import { getStoreBySlug } from '@/lib/tenant'
import { CheckoutForm } from '@/components/checkout-form'
import { StoreBrand } from '@/components/navbar'
import { storeName } from '@/lib/store-info'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  return { title: store ? `Finalizar compra | ${storeName(store)}` : 'Finalizar compra', robots: { index: false } }
}

// Página aparte del carrito, sin menú ni pie: solo lo necesario para terminar la compra. El
// carrito sobrevive la navegación acá porque CartProvider envuelve todo app/[slug]/layout.tsx.
export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) notFound()

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--st-line2)' }}>
        <div className="st-wrap flex h-[58px] items-center justify-between gap-4 md:h-[72px]">
          <StoreBrand store={store} compact />
          <div className="hidden items-center gap-2 text-[13px] md:flex" style={{ color: 'var(--st-soft)' }}>
            <span>Carrito</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <b style={{ color: 'var(--st-ink)' }}>Datos y pago</b>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Confirmación</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[14px]" style={{ color: 'var(--st-mut)' }}>
            <Lock className="h-4 w-4" style={{ color: 'var(--st-ok)' }} />
            Compra segura
          </span>
        </div>
      </header>
      <CheckoutForm store={store} />
    </div>
  )
}
