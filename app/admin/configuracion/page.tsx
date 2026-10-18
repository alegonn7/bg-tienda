import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Truck, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { getMercadoPagoStatus, getShippingStatus } from '@/app/admin/actions'
import { PaymentMethods } from '@/components/admin/payment-methods'
import { ShippingSettingsForm } from '@/components/admin/shipping-settings-form'
import { Page, PageHeader } from '@/components/admin/ui'

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mp_connected?: string; mp_error?: string }>
}) {
  const ctx = await getOrgForAdminRead()
  if (!ctx) notFound()

  const { tab, mp_connected, mp_error } = await searchParams
  const envios = tab === 'envios'

  const supabase = await createClient()
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select(
      'show_prices, payment_online_enabled, shipping_enabled, free_shipping_threshold, shipping_pricing_mode, fixed_shipping_default_cost, fixed_shipping_zones, whatsapp_orders_enabled, whatsapp_number, transfer_enabled, transfer_cbu, transfer_alias, transfer_receipt_email'
    )
    .eq('id', ctx.storeSettingsId)
    .single()

  if (!storeSettings) notFound()

  const tabs = [
    { key: 'pagos', label: 'Medios de pago', icon: Wallet, href: '/admin/configuracion', on: !envios },
    { key: 'envios', label: 'Envíos', icon: Truck, href: '/admin/configuracion?tab=envios', on: envios },
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

      {envios ? <Envios settings={storeSettings} /> : <Pagos settings={storeSettings} mpConnected={mp_connected === '1'} mpError={mp_error} />}
    </Page>
  )
}

type Settings = {
  show_prices: boolean
  payment_online_enabled: boolean
  shipping_enabled: boolean
  free_shipping_threshold: number | null
  shipping_pricing_mode: string
  fixed_shipping_default_cost: number | null
  fixed_shipping_zones: unknown
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

async function Envios({ settings }: { settings: Settings }) {
  const shippingStatus = await getShippingStatus().catch(() => ({
    connected: false,
    carrier: null,
    displayLabel: null,
    environment: null,
    origin: null,
  }))
  return (
    <ShippingSettingsForm
      pickupAddress={null}
      connected={shippingStatus.connected}
      carrier={shippingStatus.carrier as 'correo_argentino' | 'andreani' | null}
      displayLabel={shippingStatus.displayLabel}
      environment={shippingStatus.environment as 'test' | 'production' | null}
      origin={shippingStatus.origin}
      shippingEnabled={settings.shipping_enabled}
      freeShippingThreshold={settings.free_shipping_threshold}
      pricingMode={settings.shipping_pricing_mode as 'carrier' | 'fixed_zones'}
      fixedShippingDefaultCost={settings.fixed_shipping_default_cost}
      fixedShippingZones={(settings.fixed_shipping_zones ?? []) as { province: string; cost: number }[]}
    />
  )
}
