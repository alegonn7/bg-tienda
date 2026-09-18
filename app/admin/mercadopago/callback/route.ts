import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { invokeMercadoPagoFunction } from '@/lib/mercadopago'

// Mercado Pago redirige acá de vuelta al navegador del dueño de tienda — sigue siendo una
// navegación top-level GET, así que la cookie de sesión (SameSite=Lax, @supabase/ssr) viaja
// igual: no hace falta cifrar la organización dentro de "state" como haría falta si este
// callback no tuviera esa sesión disponible. "state" acá cumple su rol original de nonce
// anti-CSRF, comparado contra la cookie que puso /admin/mercadopago/connect.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const mpError = url.searchParams.get('error')

  const cookieStore = await cookies()
  const expectedState = cookieStore.get('mp_oauth_state')?.value
  cookieStore.delete('mp_oauth_state')

  if (mpError) {
    console.error('[mercadopago/callback] Mercado Pago volvió con error', {
      mpError,
      description: url.searchParams.get('error_description'),
    })
    return NextResponse.redirect(new URL(`/admin/configuracion?mp_error=${encodeURIComponent(mpError)}`, url))
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    console.error('[mercadopago/callback] state inválido', {
      hasCode: !!code,
      hasState: !!state,
      hasExpectedState: !!expectedState,
      match: state === expectedState,
    })
    return NextResponse.redirect(new URL('/admin/configuracion?mp_error=invalid_state', url))
  }

  const supabase = await createClient()

  try {
    await invokeMercadoPagoFunction(supabase, 'mercadopago-setup', { action: 'exchange_code', code })
    return NextResponse.redirect(new URL('/admin/configuracion?mp_connected=1', url))
  } catch (err) {
    console.error('[mercadopago/callback] exchange_code failed', err)
    return NextResponse.redirect(new URL('/admin/configuracion?mp_error=exchange_failed', url))
  }
}
