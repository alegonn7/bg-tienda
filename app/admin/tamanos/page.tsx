import { createClient } from '@/lib/supabase/server'
import { getAdminProducts } from '@/lib/products-server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { SizesManager } from '@/components/admin/sizes-manager'
import { Page, PageHeader } from '@/components/admin/ui'

// Talles primero en su orden natural; lo demás (medidas, números) después, alfabético.
const ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export default async function TamanosPage() {
  const ctx = await getOrgForAdminRead()
  if (!ctx) return null

  const supabase = await createClient()
  const [{ data }, products] = await Promise.all([
    supabase.from('sizes').select('id, name').order('name'),
    getAdminProducts(ctx.onlineBranchId),
  ])

  const inStore = products.filter((p) => p.branchActive !== false)
  const rank = (n: string) => {
    const i = ORDER.indexOf(n.toUpperCase())
    return i === -1 ? ORDER.length : i
  }
  const sizes = (data ?? [])
    .map((s) => ({ id: s.id, name: s.name, products: inStore.filter((p) => p.sizes?.includes(s.name)).length }))
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name, 'es', { numeric: true }))

  return (
    <Page width={900}>
      <PageHeader sub title="Tamaños y talles" description="Los elegís al cargar cada producto. El cliente elige uno al comprar." />
      <SizesManager sizes={sizes} />
    </Page>
  )
}
