import { getAdminProducts } from '@/lib/products-server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { SuggestImagesQueue } from '@/components/admin/suggest-images-queue'
import { Page, PageHeader } from '@/components/admin/ui'

export default async function SuggestImagesPage() {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) return null // app/admin/layout.tsx ya no renderiza children en este caso

  const products = await getAdminProducts(ctx.onlineBranchId)
  const pending = products.filter((p) => p.images.length === 0)

  return (
    <Page width={820}>
      <PageHeader
        sub
        title="Sugerir fotos"
        description="Buscamos fotos según el nombre de cada producto y vos elegís cuál usar."
        back={{ href: '/admin/productos', label: 'Productos' }}
      />
      <SuggestImagesQueue products={pending.map((p) => ({ id: p.id, name: p.name, category: p.category }))} />
    </Page>
  )
}
