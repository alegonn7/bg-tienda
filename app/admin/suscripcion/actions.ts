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
