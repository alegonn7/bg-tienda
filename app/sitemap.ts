import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { SITE_URL } from '@/lib/site-config'

// Se regenera cada hora: una tienda recién habilitada aparece sola, sin redeploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'monthly', priority: 1.0 },
  ]

  // store_directory ya filtra por tiendas habilitadas (ver lib/tenant.ts). Si Supabase falla, se
  // publica igual el sitemap con la landing en vez de devolver un error a Search Console.
  let slugs: (string | null)[] = []
  try {
    const { data, error } = await createPublicClient().from('store_directory').select('slug')
    if (error || !data) return entries
    slugs = (data as { slug: string | null }[]).map((row) => row.slug)
  } catch {
    return entries
  }

  for (const slug of slugs) {
    if (!slug) continue
    entries.push(
      { url: `${SITE_URL}/${slug}`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${SITE_URL}/${slug}/productos`, lastModified, changeFrequency: 'daily', priority: 0.6 },
    )
  }

  return entries
}
