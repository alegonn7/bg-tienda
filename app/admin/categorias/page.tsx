import { createClient } from '@/lib/supabase/server'
import { getAdminProducts } from '@/lib/products-server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { CategoryManager } from '@/components/admin/category-manager'
import { Page, PageHeader } from '@/components/admin/ui'

export default async function CategoriasPage() {
  const ctx = await getOrgForAdminRead()
  if (!ctx) return null

  const supabase = await createClient()
  const [{ data }, products] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    getAdminProducts(ctx.onlineBranchId),
  ])

  // Solo cuentan los productos que siguen en la tienda online (los quitados no).
  const inStore = products.filter((p) => p.branchActive !== false)
  const categories = (data ?? []).map((c) => {
    const mine = inStore.filter((p) => p.category === c.name)
    return {
      id: c.id,
      name: c.name,
      products: mine.length,
      visible: mine.filter((p) => p.active && (p.stock ?? 0) > 0).length,
    }
  })

  return (
    <Page width={1080}>
      <PageHeader
        sub
        title="Categorías"
        description="Aparecen como filtros en tu tienda y al cargar productos."
      />
      <CategoryManager categories={categories} />
    </Page>
  )
}
