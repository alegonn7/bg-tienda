import Link from 'next/link'
import { getAdminProducts } from '@/lib/products-server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { AdminProductTable } from '@/components/admin/admin-product-table'

export default async function AdminPage() {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) return null // app/admin/layout.tsx ya no renderiza children en este caso

  const products = await getAdminProducts(ctx.onlineBranchId)

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-[24px] font-medium"
            style={{ color: '#111111' }}
          >
            Productos
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: '#6b6b6b' }}>
            {products.length} en total
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="pc-btn px-5 py-2.5 text-[13px]"
        >
          + Nuevo producto
        </Link>
      </div>

      <AdminProductTable products={products} />
    </div>
  )
}
