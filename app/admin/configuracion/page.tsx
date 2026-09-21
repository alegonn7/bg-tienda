import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { getMercadoPagoStatus, getShippingStatus } from '@/app/admin/actions'
import { MercadoPagoSettingsForm } from '@/components/admin/mercadopago-settings-form'
import { ShippingSettingsForm } from '@/components/admin/shipping-settings-form'

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ mp_connected?: string; mp_error?: string }>
}) {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) notFound()

  const { mp_connected, mp_error } = await searchParams

  const supabase = await createClient()
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('show_prices, payment_online_enabled, shipping_enabled, free_shipping_threshold')
    .eq('id', ctx.storeSettingsId)
    .single()

  if (!storeSettings) notFound()

  const mpStatus = await getMercadoPagoStatus().catch(() => ({ connected: false, mpEmail: null, liveMode: null }))
  const shippingStatus = await getShippingStatus().catch(() => ({
    connected: false,
    carrier: null,
    displayLabel: null,
    environment: null,
    origin: null,
  }))

  return (
    <div className="mx-auto max-w-[700px] px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
          ← Volver
        </Link>
        <h1 className="mt-4 text-[24px] font-medium" style={{ color: '#111111' }}>
          Configuración
        </h1>
      </div>

      <div className="mb-8 p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h2 className="mb-1 text-[15px] font-medium" style={{ color: '#111111' }}>
          Mercado Pago
        </h2>
        <p className="mb-6 text-[13px]" style={{ color: '#6b6b6b' }}>
          Cobrá pedidos online. La plataforma cobra una comisión fija del 1%, que se descuenta de lo que recibís vos — el cliente nunca paga de más.
        </p>
        <MercadoPagoSettingsForm
          connected={mpStatus.connected}
          mpEmail={mpStatus.mpEmail}
          liveMode={mpStatus.liveMode}
          showPrices={storeSettings.show_prices}
          enabled={storeSettings.payment_online_enabled}
          mpConnected={mp_connected === '1'}
          mpError={mp_error}
        />
      </div>

      <div className="p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h2 className="mb-1 text-[15px] font-medium" style={{ color: '#111111' }}>
          Envíos
        </h2>
        <p className="mb-6 text-[13px]" style={{ color: '#6b6b6b' }}>
          Calculá el costo real de envío con Correo Argentino o Andreani. "Retirar en el local" siempre queda disponible, aparte de esto.
        </p>
        <ShippingSettingsForm
          connected={shippingStatus.connected}
          carrier={shippingStatus.carrier as 'correo_argentino' | 'andreani' | null}
          displayLabel={shippingStatus.displayLabel}
          environment={shippingStatus.environment as 'test' | 'production' | null}
          origin={shippingStatus.origin}
          shippingEnabled={storeSettings.shipping_enabled}
          freeShippingThreshold={storeSettings.free_shipping_threshold}
        />
      </div>
    </div>
  )
}
