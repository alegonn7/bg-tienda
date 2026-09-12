import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { invokeMercadoPagoFunction } from '@/lib/mercadopago'

// Inicia la conexión OAuth de Mercado Pago para la tienda del admin logueado. GET porque es un
// link simple ("Conectar Mercado Pago →"), no un formulario. proxy.ts ya exige sesión en
// /admin/:path*, así que si getCurrentOrgForAdmin() da null es porque la tienda no tiene
// bg-tienda habilitada, no por falta de sesión.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) return NextResponse.redirect(new URL('/admin/login', url))

  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('mp_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/admin/mercadopago',
  })

  const supabase = await createClient()

  try {
    const { authorizeUrl } = await invokeMercadoPagoFunction<{ authorizeUrl: string }>(
      supabase,
      'mercadopago-setup',
      { action: 'get_authorize_url', state },
    )
    return NextResponse.redirect(authorizeUrl)
  } catch {
    return NextResponse.redirect(new URL('/admin/configuracion?mp_error=setup_failed', url))
  }
}
