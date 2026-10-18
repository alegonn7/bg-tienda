import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Copy, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/product-form'
import { getAdminProduct } from '@/lib/products-server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { arMonthStart, timeAgo } from '@/lib/format'
import { Page, PageHeader } from '@/components/admin/ui'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getOrgForAdminRead()
  if (!ctx) notFound()

  const supabase = await createClient()
  const [product, { data: categories }, { data: sizes }, { data: sales }] = await Promise.all([
    getAdminProduct(ctx.onlineBranchId, id),
    supabase.from('categories').select('*').order('name'),
    supabase.from('sizes').select('*').order('name'),
    // Ventas de la tienda online de este producto (pedidos confirmados), para el resumen.
    supabase
      .from('store_order_items')
      .select('quantity, store_orders!inner(status, created_at)')
      .eq('product_id', id)
      .eq('store_orders.status', 'confirmed')
      .limit(500),
  ])

  if (!product) notFound()

  type SaleRow = { quantity: number; store_orders: { created_at: string } | { created_at: string }[] }
  const rows = ((sales ?? []) as SaleRow[]).map((r) => ({
    quantity: r.quantity,
    created_at: Array.isArray(r.store_orders) ? r.store_orders[0]?.created_at : r.store_orders?.created_at,
  }))
  const monthStart = arMonthStart(new Date())
  const soldThisMonth = rows.filter((r) => r.created_at && new Date(r.created_at) >= monthStart).reduce((a, r) => a + r.quantity, 0)
  const last = rows.map((r) => r.created_at).filter(Boolean).sort().at(-1)

  return (
    <Page width={1180}>
      <PageHeader
        title={product.name}
        back={{ href: '/admin/productos', label: 'Productos' }}
        actions={
          <>
            <a href={`/${ctx.organizationSlug}/productos/${product.id}`} target="_blank" rel="noreferrer" className="adm-btn adm-btn-sm md:!px-3.5 md:!py-[9px]">
              <ExternalLink />
              Ver en la tienda
            </a>
            <Link href={`/admin/productos/nuevo?duplicar=${product.id}`} className="adm-btn adm-btn-sm md:!px-3.5 md:!py-[9px]">
              <Copy />
              Duplicar
            </Link>
          </>
        }
      />
      <ProductForm
        product={product}
        categories={categories ?? []}
        sizes={sizes ?? []}
        organizationId={ctx.organizationId}
        stats={{ soldThisMonth, lastSale: last ? timeAgo(last) : null }}
      />
    </Page>
  )
}
