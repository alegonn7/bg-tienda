import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { getStoreCategories } from '@/lib/products-server'
import type { Store } from '@/lib/tenant'

export async function SiteShell({
  children,
  store,
  hasBottomBar = false,
}: {
  children: React.ReactNode
  store: Store
  // La página tiene su propia barra fija abajo en el celular (producto): el botón flotante de
  // WhatsApp se esconde ahí para no taparla.
  hasBottomBar?: boolean
}) {
  const categories = await getStoreCategories(store.organizationId)
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar store={store} categories={categories.map((c) => c.name)} />
      <main className="flex-1">{children}</main>
      <Footer store={store} categories={categories.map((c) => c.name)} />
      <CartDrawer store={store} />
      <WhatsAppButton store={store} hideOnMobile={hasBottomBar} />
    </div>
  )
}
