import Link from 'next/link'
import type { Product } from '@/lib/products'
import { productImage } from '@/lib/products'
import { formatPrice } from '@/lib/format'

export function ProductCard({
  product,
  slug,
  bordered = true,
  showPrices = false,
}: {
  product: Product
  slug: string
  bordered?: boolean
  showPrices?: boolean
}) {
  return (
    <div
      className={`group flex flex-col ${bordered ? 'product-card-bordered' : ''}`}
      style={{ backgroundColor: '#ffffff' }}
    >
      <Link
        href={`/${slug}/productos/${product.id}`}
        className="block"
        aria-label={`Ver ${product.name}`}
      >
        <div
          className="relative aspect-square w-full overflow-hidden"
          style={{ backgroundColor: '#f5f5f3' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productImage(product) || '/placeholder.jpg'}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[15px] font-medium" style={{ color: '#111111' }}>
          {product.name}
        </h3>
        <p className="mt-1 text-[13px]" style={{ color: '#6b6b6b' }}>
          {product.category}
        </p>
        {bordered ? (
          <>
            <p className="mt-3 text-[13px]" style={{ color: showPrices && product.price != null ? '#111111' : '#6b6b6b' }}>
              {showPrices && product.price != null ? formatPrice(product.price) : 'Consultá precio'}
            </p>
            <Link
              href={`/${slug}/productos/${product.id}`}
              className="pc-btn mt-5 w-full px-4 py-2.5 text-[13px]"
            >
              Ver detalle →
            </Link>
          </>
        ) : (
          <Link
            href={`/${slug}/productos/${product.id}`}
            className="detail-link mt-3 text-[13px]"
            style={{ color: '#6b6b6b' }}
          >
            Ver detalle →
          </Link>
        )}
      </div>
    </div>
  )
}
