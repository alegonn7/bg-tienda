import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { getProducts, getStoreCategories } from '@/lib/products-server'
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
  // Candidatos para "Sumá a tu pedido" en el carrito: los más nuevos con precio y stock.
  const [categories, latest] = await Promise.all([
    getStoreCategories(store.organizationId),
    store.showPrices ? getProducts(store.organizationId, 24) : Promise.resolve([]),
  ])
  const suggestions = latest.filter((p) => p.price != null && (p.stock == null || p.stock > 0))
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar store={store} categories={categories.map((c) => c.name)} />
      <main className="flex-1">{children}</main>
      <Footer store={store} categories={categories.map((c) => c.name)} />
      <CartDrawer store={store} suggestions={suggestions} />
      <WhatsAppButton store={store} hideOnMobile={hasBottomBar} />
    </div>
  )
}
