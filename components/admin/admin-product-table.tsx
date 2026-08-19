'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/products'
import { productImage } from '@/lib/products'
import { removeProductFromStore, toggleProductActive, toggleProductFeatured } from '@/app/admin/actions'

export function AdminProductTable({ products }: { products: Product[] }) {
  const router = useRouter()

  async function handleRemove(productBranchId: string | undefined, name: string) {
    if (!productBranchId) return
    if (!confirm(`¿Sacar "${name}" de la tienda online? El producto sigue existiendo en bg-gestion.`)) return
    await removeProductFromStore(productBranchId)
    router.refresh()
  }

  async function handleToggleActive(id: string, current: boolean) {
    await toggleProductActive(id, !current)
    router.refresh()
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    await toggleProductFeatured(id, !current)
    router.refresh()
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-[14px]" style={{ color: '#6b6b6b' }}>
        No hay productos todavía.{' '}
        <Link href="/admin/productos/nuevo" style={{ color: '#d81b8a' }}>
          Creá el primero →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
            {['Producto', 'Categoría', 'Precio', 'Stock', 'Más vendido', 'Estado', 'Acciones'].map((h) => (
              <th
                key={h}
                className="px-6 py-4 text-left text-[12px] uppercase"
                style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#f5f5f3' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productImage(product) || '/placeholder.jpg'}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[14px] font-medium" style={{ color: '#111111' }}>
                    {product.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-[14px]" style={{ color: '#6b6b6b' }}>
                {product.category}
              </td>
              <td className="px-6 py-4 text-[14px]" style={{ color: '#6b6b6b' }}>
                {product.price != null ? `$${product.price}` : '—'}
              </td>
              <td
                className="px-6 py-4 text-[14px]"
                style={{ color: product.stock === 0 ? '#d81b8a' : '#6b6b6b', fontWeight: product.stock === 0 ? 600 : 400 }}
              >
                {product.stock ?? '—'}
              </td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(product.id, product.featured)}
                  className="text-[12px] uppercase"
                  style={{
                    letterSpacing: '0.04em',
                    color: product.featured ? '#d81b8a' : '#6b6b6b',
                  }}
                >
                  {product.featured ? '★ Sí' : '☆ No'}
                </button>
              </td>
              <td className="px-6 py-4">
                {product.stock === 0 ? (
                  <span
                    className="text-[12px] uppercase"
                    style={{ letterSpacing: '0.04em', color: '#b45309' }}
                    title="No aparece en la tienda hasta que tenga stock de nuevo"
                  >
                    ⚠ Sin stock
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleActive(product.id, product.active)}
                    className="text-[12px] uppercase"
                    style={{
                      letterSpacing: '0.04em',
                      color: product.active ? '#16a34a' : '#6b6b6b',
                    }}
                  >
                    {product.active ? '● Activo' : '○ Inactivo'}
                  </button>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <Link href={`/admin/productos/${product.id}/editar`} className="text-[13px]" style={{ color: '#111111' }}>
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(product.productBranchId, product.name)}
                    className="text-[13px]"
                    style={{ color: '#d81b8a' }}
                  >
                    Sacar de la tienda
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
