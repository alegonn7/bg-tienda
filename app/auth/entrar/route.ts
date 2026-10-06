import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Entrada directa al panel después de comprar en binarygoats.com.ar/bg-tienda/empezar. La página
// de bienvenida de la landing le pide a la Edge Function estado-alta un acceso de un solo uso
// (token de magic link, ver bg-gestion) y manda al cliente acá: se valida el token, se abre la
// sesión en este dominio y se entra al panel. Si el token venció o ya se usó, al login de siempre.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')

  if (tokenHash) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL('/admin', request.url))
    console.error('auth/entrar: token inválido o vencido', error.message)
  }

  return NextResponse.redirect(new URL('/admin/login', request.url))
}
