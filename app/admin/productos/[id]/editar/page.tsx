import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/product-form'
import { getAdminProduct } from '@/lib/products-server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) notFound()

  const supabase = await createClient()
  const [product, { data: categories }, { data: sizes }] = await Promise.all([
    getAdminProduct(ctx.onlineBranchId, id),
    supabase.from('categories').select('*').order('name'),
    supabase.from('sizes').select('*').order('name'),
  ])

  if (!product) notFound()

  return (
    <div className="mx-auto max-w-[700px] px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
          ← Volver
        </Link>
        <h1 className="mt-4 text-[24px] font-medium" style={{ color: '#111111' }}>
          Editar producto
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: '#6b6b6b' }}>
          {product.name}
        </p>
      </div>

      <div className="p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <ProductForm
          product={product}
          categories={categories ?? []}
          sizes={sizes ?? []}
          organizationId={ctx.organizationId}
        />
      </div>
    </div>
  )
}
