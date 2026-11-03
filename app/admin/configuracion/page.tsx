import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShoppingBag, Truck, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { getMercadoPagoStatus, getShippingStatus } from '@/app/admin/actions'
import { PaymentMethods } from '@/components/admin/payment-methods'
import { ShippingSettingsForm } from '@/components/admin/shipping-settings-form'
import { Page, PageHeader } from '@/components/admin/ui'
import { CopyFeedUrl } from '@/components/admin/merchant-feed'
import { getStoreBySlug } from '@/lib/tenant'
import { getProducts } from '@/lib/products-server'
import { feedItems } from '@/lib/merchant-feed'
import { SITE_URL } from '@/lib/site-config'

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mp_connected?: string; mp_error?: string }>
}) {
  const ctx = await getOrgForAdminRead()
  if (!ctx) notFound()

  const { tab, mp_connected, mp_error } = await searchParams
  const envios = tab === 'envios'
  const google = tab === 'google'

  const supabase = await createClient()
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select(
      'show_prices, payment_online_enabled, shipping_enabled, free_shipping_threshold, shipping_pricing_mode, fixed_shipping_default_cost, fixed_shipping_zones, shipping_default_weight_grams, shipping_default_length_cm, shipping_default_width_cm, shipping_default_height_cm, whatsapp_orders_enabled, whatsapp_number, transfer_enabled, transfer_cbu, transfer_alias, transfer_receipt_email, extra'
    )
    .eq('id', ctx.storeSettingsId)
    .single()

  if (!storeSettings) notFound()

  const tabs = [
    { key: 'pagos', label: 'Medios de pago', icon: Wallet, href: '/admin/configuracion', on: !envios && !google },
    { key: 'envios', label: 'Envíos', icon: Truck, href: '/admin/configuracion?tab=envios', on: envios },
    { key: 'google', label: 'Google Shopping', icon: ShoppingBag, href: '/admin/configuracion?tab=google', on: google },
  ]

  return (
    <Page width={900}>
      <PageHeader sub title="Pagos y envíos" description="Cómo te pagan y cómo les llega el pedido a tus clientes." />
      <nav className="mb-4 flex gap-5" style={{ borderBottom: '1px solid var(--adm-line)' }}>
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            replace
            scroll={false}
            className="-mb-px flex items-center gap-1.5 pb-2.5 text-[14px]"
            style={
              t.on
                ? { borderBottom: '2px solid var(--adm-ink)', color: 'var(--adm-ink)', fontWeight: 600 }
                : { borderBottom: '2px solid transparent', color: 'var(--adm-muted)' }
            }
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Link>
        ))}
      </nav>

      {google ? (
        <GoogleShopping slug={ctx.organizationSlug} settings={storeSettings} />
      ) : envios ? (
        <Envios settings={storeSettings} branchId={ctx.onlineBranchId} />
      ) : (
        <Pagos settings={storeSettings} mpConnected={mp_connected === '1'} mpError={mp_error} />
      )}
    </Page>
  )
}

type Settings = {
  show_prices: boolean
  payment_online_enabled: boolean
  shipping_enabled: boolean
  free_shipping_threshold: number | null
  extra: Record<string, unknown> | null
  shipping_pricing_mode: string
  fixed_shipping_default_cost: number | null
  fixed_shipping_zones: unknown
  shipping_default_weight_grams: number | null
  shipping_default_length_cm: number | null
  shipping_default_width_cm: number | null
  shipping_default_height_cm: number | null
  whatsapp_orders_enabled: boolean
  whatsapp_number: string | null
  transfer_enabled: boolean
  transfer_cbu: string | null
  transfer_alias: string | null
  transfer_receipt_email: string | null
}

async function Pagos({ settings, mpConnected, mpError }: { settings: Settings; mpConnected: boolean; mpError?: string }) {
  const mpStatus = await getMercadoPagoStatus().catch(() => ({ connected: false, mpEmail: null, liveMode: null }))
  return (
    <PaymentMethods
      showPrices={settings.show_prices}
      mp={{ ...mpStatus, enabled: settings.payment_online_enabled, justConnected: mpConnected, error: mpError }}
      transfer={{ enabled: settings.transfer_enabled, cbu: settings.transfer_cbu, alias: settings.transfer_alias, receiptEmail: settings.transfer_receipt_email }}
      whatsapp={{ enabled: settings.whatsapp_orders_enabled, number: settings.whatsapp_number }}
    />
  )
}

// Feed de Google Merchant Center (app/[slug]/feed.xml): la URL para copiar y cuántos productos
// entran. Todas las tiendas comparten dominio, así que Google no deja que cada una lo reclame con su
// propio Merchant Center: lo carga Binary Goats desde su cuenta avanzada (una subcuenta por tienda). Los números salen del mismo catálogo público que lee el feed.
async function GoogleShopping({ slug, settings }: { slug: string; settings: Settings }) {
  const feedUrl = `${SITE_URL}/${slug}/feed.xml`
  const store = await getStoreBySlug(slug).catch(() => null)
  const products = store ? await getProducts(store.organizationId).catch(() => []) : []
  const { included, skipped } = store ? feedItems(store, products) : { included: [], skipped: [] }
  const noPhoto = skipped.filter((s) => s.reason === 'sin foto').length
  const noBrand = included.filter((p) => !p.brand?.trim()).length

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="adm-card adm-sec">
        <h3 className="adm-h3">Tu feed de productos</h3>
        <p className="adm-hint mt-0.5 mb-3.5">
          Con esta dirección Google lee tus productos para mostrarlos en Shopping. Se actualiza sola cada hora.
        </p>
        <CopyFeedUrl url={feedUrl} />
        {store && (
          <ul className="mt-3.5 flex flex-col gap-1.5 text-[13px]" style={{ color: 'var(--adm-muted)' }}>
            <li>
              <b style={{ color: 'var(--adm-ink)' }}>{included.length}</b> de {products.length} productos visibles entran al feed.
            </li>
            {!settings.show_prices && (
              <li style={{ color: 'var(--adm-bad)' }}>Tu tienda oculta los precios: Google necesita el precio, así que el feed sale vacío.</li>
            )}
            {settings.show_prices && noPhoto > 0 && (
              <li>
                {noPhoto} quedan afuera por no tener foto (Google no acepta productos sin imagen).{' '}
                <Link href="/admin/productos/sugerir-imagenes" className="font-medium underline" style={{ color: 'var(--adm-ink)' }}>
                  Buscar fotos
                </Link>
              </li>
            )}
            {noBrand > 0 && <li>{noBrand} no tienen marca cargada. Con marca y código de barras Google los muestra mejor.</li>}
          </ul>
        )}
        {!settings.shipping_enabled && (
          <p className="mt-3.5 rounded-[10px] px-3 py-2.5 text-[13px]" style={{ backgroundColor: 'var(--adm-bg)', color: 'var(--adm-muted)' }}>
            Tu tienda no tiene envíos activados. Para los anuncios de Shopping Google pide que hagas envíos a domicilio.
          </p>
        )}
      </div>

      <div className="adm-card adm-sec">
        <h3 className="adm-h3">Conexión con Google</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--adm-muted)' }}>
          Binary Goats carga tu catálogo en Google Merchant Center por vos: no tenés que crear nada. Mientras tanto,
          sumá fotos, marca y código de barras a tus productos para que Google los muestre mejor.
        </p>
      </div>
    </div>
  )
}

async function Envios({ settings, branchId }: { settings: Settings; branchId: string }) {
  const supabase = await createClient()
  const [{ data: branch }, shippingStatus] = await Promise.all([
    supabase.from('branches').select('address').eq('id', branchId).maybeSingle(),
    getShippingStatus().catch(() => ({
      connected: false,
      carrier: null,
      displayLabel: null,
      environment: null,
      origin: null,
    })),
  ])
  const branchAddress = (branch?.address as string | null)?.trim() || null
  return (
    <ShippingSettingsForm
      branchAddress={branchAddress}
      pickupAddress={typeof settings.extra?.pickup_address === 'string' ? settings.extra.pickup_address : ''}
      pickupHours={typeof settings.extra?.pickup_hours === 'string' ? settings.extra.pickup_hours : ''}
      origin={shippingStatus.origin}
      shippingEnabled={settings.shipping_enabled}
      freeShippingThreshold={settings.free_shipping_threshold}
      pricingMode={settings.shipping_pricing_mode as 'carrier' | 'fixed_zones'}
      fixedShippingDefaultCost={settings.fixed_shipping_default_cost}
      fixedShippingZones={(settings.fixed_shipping_zones ?? []) as { province: string; cost: number }[]}
      shippingCarriers={
        Array.isArray(settings.extra?.shipping_carriers) ? (settings.extra.shipping_carriers as string[]) : []
      }
      defaultPackage={{
        weightGrams: settings.shipping_default_weight_grams,
        lengthCm: settings.shipping_default_length_cm,
        widthCm: settings.shipping_default_width_cm,
        heightCm: settings.shipping_default_height_cm,
      }}
    />
  )
}
