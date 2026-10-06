'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reactivarSuscripcion, sincronizarReactivacion } from '@/app/admin/suscripcion/actions'

export function ReactivarSuscripcionButton({ mensaje }: { mensaje: string }) {
  const [error, setError] = useState('')
  const [pendiente, startTransition] = useTransition()

  function reactivar() {
    setError('')
    startTransition(async () => {
      const r = await reactivarSuscripcion()
      if (r.ok) window.location.href = r.url
      else setError(r.error)
    })
  }

  return (
    <div className="mt-8 p-5" style={{ border: '1px solid #111111' }}>
      <p className="text-[14px]" style={{ color: '#111111' }}>
        {mensaje}
      </p>
      <button
        type="button"
        onClick={reactivar}
        disabled={pendiente}
        className="mt-4 px-4 py-2 text-[13px] disabled:opacity-50"
        style={{ backgroundColor: '#111111', color: '#fff' }}
      >
        {pendiente ? 'Abriendo Mercado Pago…' : 'Reactivar suscripción'}
      </button>
      {error && (
        <p className="mt-2 text-[13px]" style={{ color: '#b91c1c' }}>
          {error}
        </p>
      )}
    </div>
  )
}

// Mercado Pago vuelve a /admin/suscripcion?reactivar=1. Se relee el estado unas veces (Mercado
// Pago puede tardar unos segundos en autorizar) y después se limpia la URL.
const INTENTOS = 8
const CADA_MS = 4000

export function SincronizarReactivacion() {
  const router = useRouter()
  const [estado, setEstado] = useState<'esperando' | 'lista' | 'sin-confirmar'>('esperando')

  useEffect(() => {
    let activo = true
    let intento = 0
    async function consultar() {
      const r = await sincronizarReactivacion()
      if (!activo) return
      if (r.reactivada) {
        setEstado('lista')
        router.replace('/admin/suscripcion')
        router.refresh()
        return
      }
      intento += 1
      if (intento >= INTENTOS) {
        setEstado('sin-confirmar')
        return
      }
      setTimeout(consultar, CADA_MS)
    }
    consultar()
    return () => {
      activo = false
    }
  }, [router])

  const texto = {
    esperando: 'Estamos confirmando tu pago con Mercado Pago…',
    lista: '¡Listo! Tu suscripción quedó reactivada.',
    'sin-confirmar':
      'Mercado Pago todavía no confirmó el pago. Si lo completaste, se va a reactivar sola en unos minutos; si no, podés volver a intentarlo.',
  }[estado]

  return (
    <div
      className="mb-6 px-4 py-3 text-[13px]"
      style={{
        backgroundColor: estado === 'lista' ? '#dcfce7' : '#f5f5f4',
        color: estado === 'lista' ? '#14532d' : '#44403c',
      }}
    >
      {texto}
    </div>
  )
}
