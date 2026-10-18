import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { HeroManager } from '@/components/admin/hero-manager'
import { Page } from '@/components/admin/ui'

export default async function HeroPage() {
  const ctx = await getOrgForAdminRead()
  if (!ctx) notFound()

  const supabase = await createClient()
  const [{ data }, { data: settings }] = await Promise.all([
    supabase.from('hero_images').select('*').eq('organization_id', ctx.organizationId).order('position'),
    supabase.from('store_settings').select('store_name, hero_title, hero_subtitle').eq('id', ctx.storeSettingsId).single(),
  ])

  return (
    <Page width={1180}>
      <HeroManager
        images={data ?? []}
        organizationId={ctx.organizationId}
        storeName={settings?.store_name || ctx.organizationName}
        heroTitle={settings?.hero_title ?? null}
        heroSubtitle={settings?.hero_subtitle ?? null}
      />
    </Page>
  )
}
