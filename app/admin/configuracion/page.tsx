import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { LogoManager } from '@/components/admin/logo-manager'
import { FaviconManager } from '@/components/admin/favicon-manager'
import { StoreBrandingForm } from '@/components/admin/store-branding-form'

export default async function ConfiguracionPage() {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) notFound()

  const supabase = await createClient()
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select(
      'store_name, hero_title, hero_subtitle, accent_color, whatsapp_number, instagram_url, facebook_url, show_prices, features, logo_height, header_display'
    )
    .eq('id', ctx.storeSettingsId)
    .single()

  if (!storeSettings) notFound()

  return (
    <div className="mx-auto max-w-[700px] px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
          ← Volver
        </Link>
        <h1 className="mt-4 text-[24px] font-medium" style={{ color: '#111111' }}>
          Mi Tienda
        </h1>
      </div>

      <div className="mb-8 p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h2 className="mb-1 text-[15px] font-medium" style={{ color: '#111111' }}>
          Tu tienda
        </h2>
        <p className="mb-6 text-[13px]" style={{ color: '#6b6b6b' }}>
          Cómo se ve y se presenta tu tienda hacia tus clientes.
        </p>
        <StoreBrandingForm store={storeSettings} slug={ctx.organizationSlug} />
      </div>

      <div className="mb-8 p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h2 className="mb-1 text-[15px] font-medium" style={{ color: '#111111' }}>
          Logo
        </h2>
        <p className="mb-6 text-[13px]" style={{ color: '#6b6b6b' }}>
          Aparece arriba a la izquierda, al lado del nombre de la tienda.
        </p>
        <LogoManager
          current={ctx.logoUrl}
          organizationId={ctx.organizationId}
          initialHeight={storeSettings.logo_height}
          initialDisplay={storeSettings.header_display}
        />
      </div>

      <div className="p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h2 className="mb-1 text-[15px] font-medium" style={{ color: '#111111' }}>
          Favicon
        </h2>
        <p className="mb-6 text-[13px]" style={{ color: '#6b6b6b' }}>
          El ícono que aparece en la pestaña del navegador. Si no subís uno, se usa el de bg-tienda por defecto.
        </p>
        <FaviconManager current={ctx.faviconUrl} organizationId={ctx.organizationId} />
      </div>
    </div>
  )
}
