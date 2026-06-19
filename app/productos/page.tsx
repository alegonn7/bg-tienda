import { SiteShell } from '@/components/site-shell'
import { ProductsClient } from '@/components/products-client'
import { getProducts } from '@/lib/products-server'
import { createClient } from '@/lib/supabase/server'

export default async function ProductsPage() {
  const supabase = await createClient()
  const [products, { data: cats }, { data: sizesData }] = await Promise.all([
    getProducts(),
    supabase.from('categories').select('name').order('name'),
    supabase.from('sizes').select('name').order('name'),
  ])

  const categories = ['Todos', ...(cats ?? []).map((c) => c.name)]
  const sizes = (sizesData ?? []).map((s) => s.name)

  return (
    <SiteShell>
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <ProductsClient products={products} categories={categories} sizes={sizes} />
      </section>
    </SiteShell>
  )
}
