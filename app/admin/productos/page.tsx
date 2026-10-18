import Link from 'next/link'
import { ImagePlus, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAdminProducts } from '@/lib/products-server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { AdminProductTable } from '@/components/admin/admin-product-table'
import { Page, PageHeader } from '@/components/admin/ui'

export default async function ProductosPage({
  searchParams,
}: {
  // q: búsqueda desde la barra de arriba. filtro: atajo desde Inicio (sin-stock, ocultos...).
  searchParams: Promise<{ q?: string; filtro?: string }>
}) {
  const ctx = await getOrgForAdminRead()
  if (!ctx) return null // app/admin/layout.tsx ya no renderiza children en este caso

  const { q, filtro } = await searchParams
  const supabase = await createClient()
  const [products, { data: categories }] = await Promise.all([
    getAdminProducts(ctx.onlineBranchId),
    supabase.from('categories').select('id, name').order('name'),
  ])
  const withoutImage = products.filter((p) => p.images.length === 0 && p.branchActive !== false).length
  const visible = products.filter((p) => p.active && p.branchActive !== false && (p.stock ?? 0) > 0).length

  return (
    <Page>
      <PageHeader
        title="Productos"
        description={`${products.length} ${products.length === 1 ? 'producto' : 'productos'} · ${visible} ${visible === 1 ? 'visible' : 'visibles'} en la tienda`}
        actions={
          <div className="hidden gap-2 md:flex">
            {withoutImage > 0 && (
              <Link href="/admin/productos/sugerir-imagenes" className="adm-btn">
                <ImagePlus />
                Sugerir fotos ({withoutImage})
              </Link>
            )}
            <Link href="/admin/productos/nuevo" className="adm-btn adm-btn-pri">
              <Plus />
              Nuevo producto
            </Link>
          </div>
        }
      />

      <AdminProductTable
        key={`${q ?? ''}|${filtro ?? ''}`}
        products={products}
        categories={categories ?? []}
        initialSearch={q ?? ''}
        initialFilter={filtro ?? 'todos'}
      />

      <Link
        href="/admin/productos/nuevo"
        className="fixed bottom-[84px] right-4 z-30 grid h-[54px] w-[54px] place-items-center rounded-2xl text-white shadow-lg md:hidden"
        style={{ backgroundColor: 'var(--adm-ink)' }}
        aria-label="Nuevo producto"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </Page>
  )
}
