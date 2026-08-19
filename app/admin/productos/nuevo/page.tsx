import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { ProductForm } from '@/components/admin/product-form'

export default async function NuevoProductoPage() {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) notFound()

  const supabase = await createClient()
  const [{ data: categories }, { data: sizes }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('sizes').select('*').order('name'),
  ])

  return (
    <div className="mx-auto max-w-[700px] px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
          ← Volver
        </Link>
        <h1 className="mt-4 text-[24px] font-medium" style={{ color: '#111111' }}>
          Nuevo producto
        </h1>
      </div>

      <div className="p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <ProductForm categories={categories ?? []} sizes={sizes ?? []} organizationId={ctx.organizationId} />
      </div>
    </div>
  )
}
