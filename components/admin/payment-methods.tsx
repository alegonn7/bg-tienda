'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CreditCard, Landmark, MessageCircle, Percent, Phone, User } from 'lucide-react'
import {
  disconnectMercadoPago,
  updateMercadoPagoSettings,
  updateTransferSettings,
  updateWhatsAppOrdersEnabled,
} from '@/app/admin/actions'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ErrorText, Field, SuccessText, Toggle } from '@/components/admin/ui'

type Props = {
  mp: { connected: boolean; mpEmail: string | null; liveMode: boolean | null; enabled: boolean; justConnected?: boolean; error?: string }
  transfer: { enabled: boolean; cbu: string | null; alias: string | null; receiptEmail: string | null }
  whatsapp: { enabled: boolean; number: string | null }
  showPrices: boolean
}

// Cada medio es una fila: ícono + nombre + interruptor arriba, y debajo (a todo el ancho en el
// celular, con sangría en la compu) la explicación y sus datos.
function Method({
  icon,
  tint,
  title,
  toggle,
  children,
  first,
}: {
  icon: React.ReactNode
  tint: [string, string]
  title: string
  toggle: React.ReactNode
  children: React.ReactNode
  first?: boolean
}) {
  return (
    <section className="px-4 py-4 md:px-5" style={first ? undefined : { borderTop: '1px solid var(--adm-line2)' }}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[11px]" style={{ backgroundColor: tint[0], color: tint[1] }}>
          {icon}
        </span>
        <h3 className="min-w-0 flex-1 text-[15px] font-semibold">{title}</h3>
        {toggle}
      </div>
      <div className="mt-2.5 grid gap-3 md:mt-1 md:pl-[52px]">{children}</div>
    </section>
  )
}

function Desc({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] leading-snug" style={{ color: 'var(--adm-muted)' }}>{children}</p>
}

export function PaymentMethods({ mp, transfer, whatsapp, showPrices }: Props) {
  const router = useRouter()

  // Mercado Pago
  const [mpOn, setMpOn] = useState(mp.enabled)
  const [mpBusy, setMpBusy] = useState(false)
  const [mpError, setMpError] = useState('')
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  async function toggleMp(next: boolean) {
    setMpOn(next)
    setMpBusy(true)
    setMpError('')
    try {
      await updateMercadoPagoSettings({ enabled: next })
      router.refresh()
    } catch (err) {
      setMpOn(!next)
      setMpError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setMpBusy(false)
    }
  }

  async function disconnect() {
    setConfirmDisconnect(false)
    setMpBusy(true)
    setMpError('')
    try {
      await disconnectMercadoPago()
      router.refresh()
    } catch (err) {
      setMpError(err instanceof Error ? err.message : 'No se pudo desconectar.')
    } finally {
      setMpBusy(false)
    }
  }

  // Transferencia
  const [trOn, setTrOn] = useState(transfer.enabled)
  const [alias, setAlias] = useState(transfer.alias ?? '')
  const [cbu, setCbu] = useState(transfer.cbu ?? '')
  const [email, setEmail] = useState(transfer.receiptEmail ?? '')
  const [trBusy, setTrBusy] = useState(false)
  const [trError, setTrError] = useState('')
  const [trSaved, setTrSaved] = useState(false)
  const trDirty = alias !== (transfer.alias ?? '') || cbu !== (transfer.cbu ?? '') || email !== (transfer.receiptEmail ?? '')
  const trHasData = !!(alias.trim() || cbu.trim()) && !!email.trim()

  async function saveTransfer(enabled: boolean) {
    setTrError('')
    setTrSaved(false)
    if (enabled && !trHasData) {
      setTrError('Cargá el alias o el CBU, y el mail para los comprobantes, antes de activarla.')
      return
    }
    const prev = trOn
    setTrOn(enabled)
    setTrBusy(true)
    try {
      await updateTransferSettings({ enabled, cbu: cbu.trim(), alias: alias.trim(), receiptEmail: email.trim() })
      setTrSaved(true)
      router.refresh()
    } catch (err) {
      setTrOn(prev)
      setTrError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setTrBusy(false)
    }
  }

  // WhatsApp
  const [waOn, setWaOn] = useState(whatsapp.enabled)
  const [waBusy, setWaBusy] = useState(false)
  const [waError, setWaError] = useState('')

  async function toggleWa(next: boolean) {
    setWaOn(next)
    setWaBusy(true)
    setWaError('')
    try {
      await updateWhatsAppOrdersEnabled(next)
      router.refresh()
    } catch (err) {
      setWaOn(!next)
      setWaError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setWaBusy(false)
    }
  }

  const noneOn = !(mp.connected && mpOn) && !trOn && !waOn

  return (
    <div className="grid gap-3">
      <ConfirmDialog
        open={confirmDisconnect}
        title="Desconectar Mercado Pago"
        message="La tienda deja de poder cobrar con Mercado Pago hasta que la vuelvas a conectar."
        confirmText="Desconectar"
        danger
        onConfirm={disconnect}
        onCancel={() => setConfirmDisconnect(false)}
      />

      {mp.justConnected && (
        <div className="adm-alert" style={{ backgroundColor: 'var(--adm-ok-soft)', color: 'var(--adm-ok)' }}>
          Mercado Pago quedó conectado.
        </div>
      )}
      {mp.error && (
        <div className="adm-alert" style={{ backgroundColor: 'var(--adm-bad-soft)', color: 'var(--adm-bad)' }}>
          No se pudo conectar Mercado Pago ({mp.error}). Probá de nuevo.
        </div>
      )}
      {noneOn && (
        <div className="adm-alert" style={{ backgroundColor: 'var(--adm-warn-soft)', color: 'var(--adm-warn)' }}>
          No tenés ningún medio de pago activo: tus clientes no pueden comprar. Activá al menos uno.
        </div>
      )}

      <div className="adm-card overflow-hidden">
        <Method
          first
          icon={<CreditCard className="h-[18px] w-[18px]" />}
          tint={['#e8f4fd', '#0a84d6']}
          title="Mercado Pago"
          toggle={
            mp.connected ? (
              <Toggle checked={mpOn} disabled={mpBusy || (!showPrices && !mpOn)} onChange={toggleMp} label="Cobrar con Mercado Pago" />
            ) : null
          }
        >
          <Desc>Tarjeta, débito y dinero en cuenta. El pago se confirma solo y la plata va directo a tu cuenta.</Desc>
          {mp.connected ? (
            <>
              <div className="grid gap-1.5 text-[13px] sm:flex sm:flex-wrap sm:items-center sm:gap-x-4">
                <span className="adm-badge adm-b-ok w-fit">{mp.liveMode === false ? 'Conectado (prueba)' : 'Conectado'}</span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <User className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--adm-soft)' }} />
                  <span className="truncate">{mp.mpEmail ?? 'Cuenta de Mercado Pago'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--adm-soft)' }} />
                  Comisión del 1% (la paga el cliente)
                </span>
              </div>
              {!showPrices && (
                <p className="text-[12px]" style={{ color: 'var(--adm-warn)' }}>
                  Para cobrar online primero activá &ldquo;Mostrar precios&rdquo; en{' '}
                  <Link href="/admin/personalizacion" className="underline">
                    Apariencia
                  </Link>
                  .
                </p>
              )}
              <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={mpBusy} className="adm-btn adm-btn-sm w-fit">
                Desconectar cuenta
              </button>
            </>
          ) : (
            <a href="/admin/mercadopago/connect" className="adm-btn adm-btn-pri w-fit">
              Conectar Mercado Pago
            </a>
          )}
          <ErrorText>{mpError}</ErrorText>
        </Method>

        <Method
          icon={<Landmark className="h-[18px] w-[18px]" />}
          tint={['#fef3e2', '#b45309']}
          title="Transferencia bancaria"
          toggle={<Toggle checked={trOn} disabled={trBusy} onChange={(v) => saveTransfer(v)} label="Aceptar transferencias" />}
        >
          <Desc>El cliente ve tu alias, transfiere y te manda el comprobante. Vos confirmás el pago desde Pedidos.</Desc>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Alias">
              <input value={alias} onChange={(e) => { setTrSaved(false); setAlias(e.target.value) }} placeholder="mi.tienda.mp" className="adm-input" />
            </Field>
            <Field label="CBU / CVU">
              <input value={cbu} onChange={(e) => { setTrSaved(false); setCbu(e.target.value) }} inputMode="numeric" placeholder="22 números" className="adm-input" />
            </Field>
            <Field label="Mail para recibir comprobantes" className="sm:col-span-2">
              <input type="email" value={email} onChange={(e) => { setTrSaved(false); setEmail(e.target.value) }} placeholder="tu-mail@ejemplo.com" className="adm-input" />
            </Field>
          </div>
          {(trDirty || trError || trSaved) && (
            <div className="flex flex-wrap items-center gap-3">
              {trDirty && (
                <button type="button" onClick={() => saveTransfer(trOn)} disabled={trBusy} className="adm-btn adm-btn-pri adm-btn-sm">
                  {trBusy ? 'Guardando…' : 'Guardar datos'}
                </button>
              )}
              <ErrorText>{trError}</ErrorText>
              {!trDirty && !trError && <SuccessText>Guardado</SuccessText>}
            </div>
          )}
        </Method>

        <Method
          icon={<MessageCircle className="h-[18px] w-[18px]" />}
          tint={['#e7f6ec', '#15803d']}
          title="Pedido por WhatsApp"
          toggle={<Toggle checked={waOn} disabled={waBusy || (!whatsapp.number && !waOn)} onChange={toggleWa} label="Pedidos por WhatsApp" />}
        >
          <Desc>El cliente arma el carrito y te lo manda por WhatsApp. Coordinan el pago y la entrega entre ustedes.</Desc>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            {whatsapp.number ? (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" style={{ color: 'var(--adm-soft)' }} />+{whatsapp.number.replace(/^\+/, '')}
              </span>
            ) : (
              <span style={{ color: 'var(--adm-warn)' }}>Primero cargá tu número de WhatsApp.</span>
            )}
            <Link href="/admin/personalizacion" className="underline" style={{ color: 'var(--adm-muted)' }}>
              {whatsapp.number ? 'Cambiar en Apariencia' : 'Ir a Apariencia'}
            </Link>
          </p>
          <ErrorText>{waError}</ErrorText>
        </Method>
      </div>
    </div>
  )
}
