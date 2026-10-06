import { createClient } from '@/lib/supabase/server'

// Estado de la suscripción de la tienda a Binary Goats (alta automática desde la landing). Lo leen
// el dueño y los administradores; las filas las escriben solo las Edge Functions de bg-gestion.

// Panel de suscripciones de Mercado Pago del lado del que paga: ahí se cambia la tarjeta o se cancela.
export const MP_SUSCRIPCIONES_URL = 'https://www.mercadopago.com.ar/subscriptions'
export const WHATSAPP_SOPORTE_URL = `https://wa.me/542241527649?text=${encodeURIComponent(
  'Hola! Tengo una consulta sobre la suscripción de mi tienda en BG Tienda.',
)}`

const ESTADOS: Record<string, string> = {
  pending: 'Esperando el primer pago',
  trial: 'Prueba',
  active: 'Activa',
  past_due: 'Pago atrasado',
  suspended: 'Suspendida',
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

export async function SuscripcionResumen({
  organizationId,
  subscriptionStatus,
}: {
  organizationId: string
  subscriptionStatus: string | null
}) {
  const supabase = await createClient()
  const [{ data: sub }, { data: pagos }, { data: org }] = await Promise.all([
    supabase
      .from('platform_subscriptions')
      .select('id, current_amount, full_amount, next_payment_date, cancelled_at')
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
      <p className="text-[14px]" style={{ color: '#6b6b6b' }}>
        Tu tienda no tiene una suscripción automática. Si tenés dudas sobre tu plan,{' '}
        <a href={WHATSAPP_SOPORTE_URL} className="underline" target="_blank" rel="noreferrer">
          escribinos por WhatsApp
        </a>
        .
      </p>
    )
  }

  const filas: [string, string][] = [
    ['Plan', 'BG Tienda'],
    ['Estado', ESTADOS[subscriptionStatus ?? ''] ?? subscriptionStatus ?? '—'],
    ['Cuota mensual', formatArs(sub.full_amount)],
  ]
  if (sub.cancelled_at) {
    filas.push(['Cancelada el', formatFecha(sub.cancelled_at)])
    if (org?.subscription_ends_at) filas.push(['Activa hasta', formatFecha(org.subscription_ends_at)])
  } else if (sub.next_payment_date) {
    filas.push(['Próximo cobro', `${formatFecha(sub.next_payment_date)} · ${formatArs(sub.current_amount)}`])
  }

  return (
    <div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[14px]">
        {filas.map(([k, v]) => (
          <div key={k} className="contents">
            <dt style={{ color: '#6b6b6b' }}>{k}</dt>
            <dd style={{ color: '#111111' }}>{v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 text-[13px]" style={{ color: '#6b6b6b' }}>
        La cuota se cobra sola cada mes con Mercado Pago. Para cambiar la tarjeta o cancelar, entrá a{' '}
        <a href={MP_SUSCRIPCIONES_URL} className="underline" target="_blank" rel="noreferrer">
          tus suscripciones en Mercado Pago
        </a>
        . Si cancelás, la tienda sigue activa hasta el final del mes que ya pagaste.
      </p>

      <h3 className="mt-8 mb-3 text-[14px] font-medium" style={{ color: '#111111' }}>
        Pagos
      </h3>
      {pagos && pagos.length > 0 ? (
        <table className="w-full text-[13px]">
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid #e5e5e5' }}>
                <td className="py-2" style={{ color: '#6b6b6b' }}>
                  {formatFecha(p.debit_date)}
                </td>
                <td className="py-2" style={{ color: '#111111' }}>
                  {formatArs(p.amount)}
                </td>
                <td className="py-2 text-right" style={{ color: p.status === 'approved' ? '#15803d' : '#b91c1c' }}>
                  {ESTADOS_PAGO[p.status] ?? p.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-[13px]" style={{ color: '#6b6b6b' }}>
          Todavía no hay pagos registrados.
        </p>
      )}
    </div>
  )
}
