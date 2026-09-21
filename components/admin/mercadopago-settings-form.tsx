'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateMercadoPagoSettings, disconnectMercadoPago } from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'

type Props = {
  connected: boolean
  mpEmail: string | null
  liveMode: boolean | null
  showPrices: boolean
  enabled: boolean
  mpConnected?: boolean
  mpError?: string
}

export function MercadoPagoSettingsForm({
  connected,
  mpEmail,
  liveMode,
  showPrices,
  enabled,
  mpConnected,
  mpError,
}: Props) {
  const router = useRouter()
  const [paymentEnabled, setPaymentEnabled] = useState(enabled)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await updateMercadoPagoSettings({ enabled: paymentEnabled })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    setConfirmingDisconnect(false)
    setDisconnecting(true)
    setError('')
    try {
      await disconnectMercadoPago()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desconectar')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ConfirmDialog
        open={confirmingDisconnect}
        title="Desconectar Mercado Pago"
        message="¿Desconectar Mercado Pago? La tienda deja de poder cobrar pagos online hasta que se vuelva a conectar."
        confirmText="Desconectar"
        danger
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmingDisconnect(false)}
      />
      {mpConnected && (
        <p className="text-[13px]" style={{ color: '#16a34a' }}>
          Conectado correctamente.
        </p>
      )}
      {mpError && (
        <p className="text-[13px]" style={{ color: '#d81b8a' }}>
          No se pudo conectar Mercado Pago ({mpError}). Intentá de nuevo.
        </p>
      )}

      {!connected ? (
        <>
          <p className="text-[14px]" style={{ color: '#111111' }}>
            Conectá tu cuenta de Mercado Pago para poder cobrar pedidos online. El dinero se
            acredita directo en tu cuenta.
          </p>
          <a href="/admin/mercadopago/connect" className="pc-btn w-fit px-6 py-3 text-[14px]">
            Conectar Mercado Pago →
          </a>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <p className="text-[14px]" style={{ color: '#111111' }}>
            Conectado como: <strong>{mpEmail ?? 'cuenta de Mercado Pago'}</strong>
            {liveMode === false && ' (cuenta de prueba)'}
          </p>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="mp_enabled"
              checked={paymentEnabled}
              disabled={!showPrices}
              onChange={(e) => setPaymentEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="mp_enabled" className="text-[14px]" style={{ color: showPrices ? '#111111' : '#6b6b6b' }}>
              Habilitar pago online con Mercado Pago en la tienda
            </label>
          </div>
          {!showPrices && (
            <p className="text-[12px]" style={{ color: '#6b6b6b' }}>
              Para habilitar esto primero tenés que activar &quot;Mostrar precios públicamente&quot; arriba.
            </p>
          )}

          {error && (
            <p className="text-[13px]" style={{ color: '#d81b8a' }}>
              {error}
            </p>
          )}
          {saved && !error && (
            <p className="text-[13px]" style={{ color: '#16a34a' }}>
              Guardado.
            </p>
          )}

          <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid #e5e5e5' }}>
            <button type="submit" disabled={saving} className="pc-btn px-6 py-3 text-[14px] disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar cambios →'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDisconnect(true)}
              disabled={disconnecting}
              className="text-[13px] disabled:opacity-60"
              style={{ color: '#6b6b6b' }}
            >
              {disconnecting ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
