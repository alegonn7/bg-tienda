import { CreditCard, MessageCircle, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CancelarSuscripcionButton } from '@/components/admin/cancelar-suscripcion-button'
import { ReactivarSuscripcionButton } from '@/components/admin/reactivar-suscripcion'

// Estado de la suscripción de la tienda a Binary Goats (alta automática desde la landing). Lo leen
// el dueño y los administradores; las filas las escriben solo las Edge Functions de bg-gestion.

// Panel de suscripciones de Mercado Pago del lado del que paga: ahí se cambia la tarjeta.
export const MP_SUSCRIPCIONES_URL = 'https://www.mercadopago.com.ar/subscriptions'
export const WHATSAPP_SOPORTE_URL = `https://wa.me/542241527649?text=${encodeURIComponent(
  'Hola! Tengo una consulta sobre la suscripción de mi tienda en BG Tienda.',
)}`

const ESTADOS: Record<string, [string, string]> = {
  pending: ['Esperando el primer pago', 'adm-b-warn'],
  trial: ['Prueba', 'adm-b-info'],
  active: ['Activa', 'adm-b-ok'],
  past_due: ['Pago atrasado', 'adm-b-warn'],
  suspended: ['Suspendida', 'adm-b-bad'],
}

const ESTADOS_PAGO: Record<string, string> = {
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  refunded: 'Devuelto',
  charged_back: 'Contracargo',
}

function formatArs(value: number | string | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(value))
}

function formatFecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium' })
}

// Hasta cuándo sigue activa si cancela hoy: un mes después del último cobro aprobado (lo mismo que
// calcula sincronizarSuscripcion en bg-gestion al registrar la cancelación).
function finDelPeriodo(pagos: { status: string; debit_date: string | null }[]): string | null {
  const ultimo = pagos.find((p) => p.status === 'approved' && p.debit_date)
  if (!ultimo?.debit_date) return null
  const hasta = new Date(ultimo.debit_date)
  hasta.setMonth(hasta.getMonth() + 1)
  return formatFecha(hasta.toISOString())
}

function mensajeReactivar(estado: string | null, activaHasta: string | null, cuota: number | string) {
  if (estado !== 'suspended' && activaHasta && new Date(activaHasta).getTime() > Date.now()) {
    return `Tu tienda sigue activa hasta el ${formatFecha(activaHasta)}. Si reactivás ahora, no se te cobra nada hasta ese día y después sigue ${formatArs(cuota)} por mes.`
  }
  return `Reactivá por ${formatArs(cuota)} por mes y tu tienda vuelve a estar online apenas Mercado Pago confirme el pago. Todo lo que tenías cargado sigue ahí.`
}

export async function SuscripcionResumen({
  organizationId,
  subscriptionStatus,
  esDueno = false,
}: {
  organizationId: string
  subscriptionStatus: string | null
  // Cancelar y reactivar: solo el dueño, y solo desde Mi suscripción.
  esDueno?: boolean
}) {
  const supabase = await createClient()
  const [{ data: sub }, { data: pagos }, { data: org }] = await Promise.all([
    supabase
      .from('platform_subscriptions')
      .select('id, current_amount, full_amount, next_payment_date, cancelled_at, mp_preapproval_id, mp_plan_id')
      .eq('organization_id', organizationId)
      .maybeSingle(),
    supabase
      .from('platform_payments')
      .select('id, amount, status, debit_date')
      .eq('organization_id', organizationId)
      .order('debit_date', { ascending: false })
      .limit(12),
    supabase.from('organizations').select('subscription_ends_at').eq('id', organizationId).maybeSingle(),
  ])

  if (!sub) {
    return (
      <div className="adm-card p-5">
        <p className="text-[14px]" style={{ color: 'var(--adm-muted)' }}>
          Tu tienda no tiene una suscripción automática. Si tenés dudas sobre tu plan,{' '}
          <a href={WHATSAPP_SOPORTE_URL} className="underline" target="_blank" rel="noreferrer">
            escribinos por WhatsApp
          </a>
          .
        </p>
      </div>
    )
  }

  const [estado, tono] = ESTADOS[subscriptionStatus ?? ''] ?? [subscriptionStatus ?? '—', 'adm-b-gray']
  const datos: [string, string][] = []
  if (sub.cancelled_at) {
    datos.push(['Cancelada el', formatFecha(sub.cancelled_at)])
    if (org?.subscription_ends_at) datos.push(['Activa hasta', formatFecha(org.subscription_ends_at)])
  } else if (sub.next_payment_date) {
    datos.push(['Próximo cobro', `${formatFecha(sub.next_payment_date)} · ${formatArs(sub.current_amount)}`])
  }
  datos.push(['Cuota mensual', formatArs(sub.full_amount)], ['Se paga con', 'Mercado Pago'])

  const puedeCancelar = esDueno && sub.mp_preapproval_id && !sub.cancelled_at && subscriptionStatus !== 'suspended'
  // Sin mp_preapproval_id pero con plan: un link de reactivación que todavía no se pagó.
  const puedeReactivar = esDueno && (sub.mp_preapproval_id || sub.mp_plan_id) && (sub.cancelled_at || subscriptionStatus === 'suspended')

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="grid min-w-0 gap-4">
        <section className="adm-card overflow-hidden">
          <div className="flex items-center gap-3 p-4 md:p-5">
            <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-[12px]" style={{ backgroundColor: 'var(--adm-ink)', color: '#fff' }}>
              <Store className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold">
                BG Tienda <span className={`adm-badge ${tono}`}>{estado}</span>
              </p>
              <p className="text-[13px]" style={{ color: 'var(--adm-muted)' }}>Se cobra sola todos los meses con Mercado Pago</p>
            </div>
            <p className="hidden text-right sm:block">
              <span className="text-[26px] font-semibold tracking-[-0.02em]">{formatArs(sub.full_amount)}</span>
              <span className="text-[13px]" style={{ color: 'var(--adm-soft)' }}>/mes</span>
            </p>
          </div>
          <dl className="grid sm:grid-cols-3" style={{ borderTop: '1px solid var(--adm-line2)' }}>
            {datos.map(([k, v], i) => (
              <div
                key={k}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:block md:px-5"
                style={i > 0 ? { borderTop: '1px solid var(--adm-line2)' } : undefined}
              >
                <dt className="text-[12px]" style={{ color: 'var(--adm-muted)' }}>{k}</dt>
                <dd className="text-right text-[14px] font-medium sm:text-left">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {puedeReactivar && (
          <ReactivarSuscripcionButton mensaje={mensajeReactivar(subscriptionStatus, org?.subscription_ends_at ?? null, sub.full_amount)} />
        )}

        <section className="adm-card overflow-hidden">
          <div className="adm-card-h">
            <h3>Últimos pagos</h3>
          </div>
          {pagos && pagos.length > 0 ? (
            <ul>
              {pagos.map((p, i) => (
                <li key={p.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-[14px] md:px-5" style={i > 0 ? { borderTop: '1px solid var(--adm-line2)' } : undefined}>
                  <span>{formatFecha(p.debit_date)}</span>
                  <span className="font-medium">{formatArs(p.amount)}</span>
                  <span className={`adm-badge ${p.status === 'approved' ? 'adm-b-ok' : p.status === 'pending' || p.status === 'in_process' ? 'adm-b-warn' : 'adm-b-bad'}`}>
                    {ESTADOS_PAGO[p.status] ?? p.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-hint px-4 py-4 md:px-5">Todavía no hay pagos registrados.</p>
          )}
        </section>
      </div>

      <aside className="grid gap-4">
        <section className="adm-card p-4 md:p-5">
          <h3 className="adm-h3">¿Necesitás ayuda?</h3>
          <p className="adm-hint mt-0.5 text-[13px]">Escribinos y te respondemos por WhatsApp.</p>
          <a href={WHATSAPP_SOPORTE_URL} target="_blank" rel="noreferrer" className="adm-btn adm-btn-acc adm-btn-sm mt-3">
            <MessageCircle />
            Hablar con soporte
          </a>
        </section>
        <section className="adm-card p-4 md:p-5">
          <h3 className="adm-h3">Cambiar tarjeta{puedeCancelar ? ' o cancelar' : ''}</h3>
          <p className="adm-hint mt-0.5 text-[13px]">
            La tarjeta se cambia desde tus suscripciones en Mercado Pago.
            {puedeCancelar && ' Si cancelás, la tienda sigue online hasta el final del mes que ya pagaste.'}
          </p>
          <a href={MP_SUSCRIPCIONES_URL} target="_blank" rel="noreferrer" className="adm-btn adm-btn-sm mt-3">
            <CreditCard />
            Cambiar tarjeta en Mercado Pago
          </a>
          {puedeCancelar && <CancelarSuscripcionButton activaHasta={finDelPeriodo(pagos ?? [])} />}
        </section>
      </aside>
    </div>
  )
}
