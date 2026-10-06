'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminOrgWithStatus } from '@/lib/tenant'
import { invokeMercadoPagoFunction } from '@/lib/mercadopago'

// Cancela la suscripción a BG Tienda (Edge Function cancelar-suscripcion de bg-gestion, que
// vuelve a chequear que sea el dueño). Si ya pagó el mes, la tienda sigue activa hasta que vence.
export async function cancelarSuscripcion(): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAdminOrgWithStatus()
  if (!ctx || ctx.role !== 'owner') return { ok: false, error: 'Solo el dueño de la cuenta puede cancelar la suscripción' }

  try {
    const supabase = await createClient()
    await invokeMercadoPagoFunction(supabase, 'cancelar-suscripcion', {})
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'No pudimos cancelar la suscripción' }
  }

  revalidatePath('/admin', 'layout')
  return { ok: true }
}

// Reactivar después de cancelar o de quedar suspendida (Edge Function reactivar-suscripcion, que
// vuelve a chequear que sea el dueño). Devuelve el link de Mercado Pago para autorizar el pago.
export async function reactivarSuscripcion(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ctx = await getAdminOrgWithStatus()
  if (!ctx || ctx.role !== 'owner') return { ok: false, error: 'Solo el dueño de la cuenta puede reactivar la suscripción' }

  try {
    const supabase = await createClient()
    const data = await invokeMercadoPagoFunction<{ init_point: string }>(supabase, 'reactivar-suscripcion', {})
    return { ok: true, url: data.init_point }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'No pudimos reactivar la suscripción' }
  }
}

// Al volver de Mercado Pago: relee el estado sin esperar el aviso del webhook.
export async function sincronizarReactivacion(): Promise<{ reactivada: boolean }> {
  const ctx = await getAdminOrgWithStatus()
  if (!ctx || ctx.role !== 'owner') return { reactivada: false }

  try {
    const supabase = await createClient()
    const data = await invokeMercadoPagoFunction<{ reactivada: boolean }>(supabase, 'reactivar-suscripcion', {
      accion: 'sincronizar',
    })
    if (data.reactivada) revalidatePath('/admin', 'layout')
    return { reactivada: !!data.reactivada }
  } catch {
    return { reactivada: false }
  }
}
