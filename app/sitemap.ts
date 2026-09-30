import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { SITE_URL } from '@/lib/site-config'

// Se regenera cada hora: una tienda recién habilitada aparece sola, sin redeploy.
export const revalidate = 3600

type CatalogRow = { product_id: string; organization_id: string; created_at: string | null }

// PostgREST devuelve como máximo 1000 filas por request: se pagina hasta agotar el catálogo (con
// tope en el límite de 50.000 URLs por sitemap). Si una página falla se usa lo que se juntó.
async function fetchCatalogRows(supabase: ReturnType<typeof createPublicClient>): Promise<CatalogRow[]> {
  const PAGE = 1000
  const rows: CatalogRow[] = []
  for (let from = 0; from < 49_000; from += PAGE) {
    const { data, error } = await supabase
      .from('store_catalog')
      .select('product_id, organization_id, created_at')
      .order('product_id')
      .range(from, from + PAGE - 1)
    if (error || !data) break
    rows.push(...(data as CatalogRow[]))
    if (data.length < PAGE) break
  }
  return rows
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'monthly', priority: 1.0 },
  ]

  // store_directory y store_catalog ya filtran por tienda habilitada y producto visible (ver
  // lib/tenant.ts y lib/products-server.ts). Si Supabase falla, se publica igual el sitemap con la
  // landing en vez de devolver un error a Search Console.
  try {
    const supabase = createPublicClient()
    const [stores, productRows] = await Promise.all([
      supabase.from('store_directory').select('slug, organization_id'),
      fetchCatalogRows(supabase),
    ])
    if (stores.error || !stores.data) return entries

    const slugByOrg = new Map<string, string>()
    for (const { slug, organization_id } of stores.data as { slug: string | null; organization_id: string }[]) {
      if (!slug) continue
      slugByOrg.set(organization_id, slug)
      entries.push(
        { url: `${SITE_URL}/${slug}`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
        { url: `${SITE_URL}/${slug}/productos`, lastModified, changeFrequency: 'daily', priority: 0.6 },
      )
    }

    for (const { product_id, organization_id, created_at } of productRows) {
      const slug = slugByOrg.get(organization_id)
      if (!slug) continue
      entries.push({
        url: `${SITE_URL}/${slug}/productos/${product_id}`,
        lastModified: created_at ? new Date(created_at) : lastModified,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  } catch {
    return entries
  }

  return entries
}
