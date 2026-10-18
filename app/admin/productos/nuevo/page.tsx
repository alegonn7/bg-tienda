import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminProduct } from '@/lib/products-server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { ProductForm } from '@/components/admin/product-form'
import { Page, PageHeader } from '@/components/admin/ui'

export default async function NuevoProductoPage({
  searchParams,
}: {
  // ?duplicar=<id>: arranca con los datos de otro producto (botón "Duplicar" de editar).
  searchParams: Promise<{ duplicar?: string }>
}) {
  const ctx = await getOrgForAdminRead()
  if (!ctx) notFound()

  const { duplicar } = await searchParams
  const supabase = await createClient()
  const [{ data: categories }, { data: sizes }, copyFrom] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('sizes').select('*').order('name'),
    duplicar ? getAdminProduct(ctx.onlineBranchId, duplicar) : Promise.resolve(null),
  ])

  return (
    <Page width={1180}>
      <PageHeader
        sub
        title={copyFrom ? 'Duplicar producto' : 'Nuevo producto'}
        back={{ href: '/admin/productos', label: 'Productos' }}
      />
      <ProductForm
        copyFrom={copyFrom ?? undefined}
        categories={categories ?? []}
        sizes={sizes ?? []}
        organizationId={ctx.organizationId}
      />
    </Page>
  )
}
