'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShoppingBag, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BINARY_GOATS_URL, WHATSAPP_NUMBER } from '@/lib/site-config'

const OLVIDE_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Me olvidé la contraseña del panel de mi tienda.')}`

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await createClient().auth.signInWithPassword({ email, password })

    if (error) {
      setError('El email o la contraseña no son correctos.')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-[380px]">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] text-[13px] font-bold" style={{ backgroundColor: 'var(--adm-ink)', color: '#fff' }}>
            BG
          </span>
          <h1 className="mt-6 text-[26px] font-semibold tracking-[-0.01em]">Entrá a tu tienda</h1>
          <p className="adm-hint mt-1 text-[14px]">Ingresá con tu cuenta de BG.</p>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
            <div>
              <label className="adm-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="adm-input !py-3"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label className="adm-label" htmlFor="password">
                  Contraseña
                </label>
                <a href={OLVIDE_URL} target="_blank" rel="noreferrer" className="text-[12px]" style={{ color: 'var(--adm-muted)' }}>
                  ¿La olvidaste?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="adm-input !py-3 !pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ color: 'var(--adm-soft)' }}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[13px]" style={{ color: 'var(--adm-bad)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="adm-btn adm-btn-pri mt-1 w-full !py-3 text-[14px]">
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--adm-muted)' }}>
            ¿Todavía no tenés tienda?{' '}
            <a href={BINARY_GOATS_URL} className="underline" style={{ color: 'var(--adm-ink)' }}>
              Conocé BG Tienda
            </a>
          </p>
        </div>
      </div>

      <div
        className="relative hidden flex-col justify-between overflow-hidden p-14 text-white lg:flex"
        style={{ background: 'linear-gradient(160deg, #1d1a22 0%, #2a1a2a 45%, #8a1660 100%)' }}
      >
        <p className="text-[14px] font-semibold">BG Tienda</p>
        <div className="max-w-[420px]">
          <p className="text-[34px] font-semibold leading-[1.15] tracking-[-0.02em]">Todo tu negocio online, desde el celu o la compu.</p>
          <div className="mt-7 grid gap-2.5">
            {[
              [ShoppingBag, 'Pedidos al instante', 'Ves cada venta apenas entra y la confirmás con un toque.'],
              [TrendingUp, 'Tus números claros', 'Cuánto vendiste este mes y qué productos se mueven.'],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof ShoppingBag
              return (
                <div key={title as string} className="flex items-center gap-3 rounded-[12px] p-3.5" style={{ backgroundColor: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[9px]" style={{ backgroundColor: 'rgba(255,255,255,.1)' }}>
                    <I className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold">{title as string}</span>
                    <span className="block text-[13px]" style={{ color: 'rgba(255,255,255,.7)' }}>
                      {text as string}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.55)' }}>
          © {new Date().getFullYear()} BG Gestión
        </p>
      </div>
    </div>
  )
}
