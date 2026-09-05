import { getAdminProducts } from '@/lib/products-server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { SuggestImagesQueue } from '@/components/admin/suggest-images-queue'

export default async function SuggestImagesPage() {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) return null // app/admin/layout.tsx ya no renderiza children en este caso

  const products = await getAdminProducts(ctx.onlineBranchId)
  const pending = products.filter((p) => p.images.length === 0)

  return (
    <div className="mx-auto max-w-[720px] px-8 py-10">
      <div className="mb-8">
        <h1 className="text-[24px] font-medium" style={{ color: '#111111' }}>
          Sugerir imágenes
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: '#6b6b6b' }}>
          Buscamos candidatas en base al nombre de cada producto — vos elegís cuál usar.
        </p>
      </div>

      <SuggestImagesQueue
        products={pending.map((p) => ({ id: p.id, name: p.name, category: p.category }))}
      />
    </div>
  )
}
