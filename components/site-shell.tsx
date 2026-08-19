import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { WhatsAppButton } from '@/components/whatsapp-button'
import type { Store } from '@/lib/tenant'

export function SiteShell({
  children,
  store,
}: {
  children: React.ReactNode
  store: Store
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar store={store} />
      <main className="flex-1">{children}</main>
      <Footer store={store} />
      <CartDrawer store={store} />
      <WhatsAppButton store={store} />
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[13px] uppercase"
      style={{ letterSpacing: '0.08em', color: '#6b6b6b' }}
    >
      {children}
    </p>
  )
}
