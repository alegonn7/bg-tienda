import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminProducts } from '@/lib/products-server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { AppearanceEditor } from '@/components/admin/appearance-editor'
import { Page } from '@/components/admin/ui'

export default async function PersonalizacionPage() {
  const ctx = await getOrgForAdminRead()
  if (!ctx) notFound()

  const supabase = await createClient()
  const [{ data: storeSettings }, { data: hero }, products] = await Promise.all([
    supabase
      .from('store_settings')
      .select('store_name, hero_title, accent_color, whatsapp_number, instagram_url, facebook_url, show_prices, features, logo_height, header_display')
      .eq('id', ctx.storeSettingsId)
      .single(),
    supabase.from('hero_images').select('url').eq('organization_id', ctx.organizationId).order('position').limit(1),
    getAdminProducts(ctx.onlineBranchId),
  ])

  if (!storeSettings) notFound()

  // Para la vista previa: los primeros productos visibles con foto (o cualquiera si no hay).
  const visible = products.filter((p) => p.active && p.branchActive !== false)
  const sample = [...visible.filter((p) => p.images.length > 0), ...visible.filter((p) => p.images.length === 0)]
    .slice(0, 4)
    .map((p) => ({ name: p.name, image: p.images[0] ?? null, price: p.price ?? null }))

  return (
    <Page width={1180}>
      <AppearanceEditor
        store={storeSettings}
        slug={ctx.organizationSlug}
        organizationId={ctx.organizationId}
        organizationName={ctx.organizationName}
        logoUrl={ctx.logoUrl}
        faviconUrl={ctx.faviconUrl}
        heroImage={hero?.[0]?.url ?? null}
        heroTitle={storeSettings.hero_title}
        sampleProducts={sample}
      />
    </Page>
  )
}
