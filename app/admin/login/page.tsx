'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ backgroundColor: '#fafaf9' }}
    >
      <div className="w-full max-w-[380px]">
        <div className="mb-10">
          <span
            className="mb-6 block h-px w-8"
            style={{ backgroundColor: '#d81b8a' }}
            aria-hidden="true"
          />
          <h1
            className="text-[28px] font-medium"
            style={{ color: '#111111' }}
          >
            Panel Admin
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: '#6b6b6b' }}>
            bg-tienda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-[12px] uppercase"
              style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
              style={{
                border: '1px solid #e5e5e5',
                backgroundColor: '#fff',
                color: '#111111',
              }}
            />
          </div>

          <div>
            <label
              className="block text-[12px] uppercase"
              style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
              style={{
                border: '1px solid #e5e5e5',
                backgroundColor: '#fff',
                color: '#111111',
              }}
            />
          </div>

          {error && (
            <p className="text-[13px]" style={{ color: '#d81b8a' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pc-btn mt-2 w-full py-3.5 text-[14px] disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
