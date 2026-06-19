import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { WhatsAppButton } from '@/components/whatsapp-button'

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
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
