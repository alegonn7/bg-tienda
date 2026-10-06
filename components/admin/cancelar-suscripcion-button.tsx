'use client'

import { useState, useTransition } from 'react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { cancelarSuscripcion } from '@/app/admin/suscripcion/actions'

export function CancelarSuscripcionButton({ activaHasta }: { activaHasta: string | null }) {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState('')
  const [pendiente, startTransition] = useTransition()

  function confirmar() {
    setAbierto(false)
    setError('')
    startTransition(async () => {
      const r = await cancelarSuscripcion()
      if (!r.ok) setError(r.error)
    })
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={pendiente}
        className="px-4 py-2 text-[13px] disabled:opacity-50"
        style={{ border: '1px solid #d81b8a', color: '#d81b8a' }}
      >
        {pendiente ? 'Cancelando…' : 'Cancelar suscripción'}
      </button>
      {error && (
        <p className="mt-2 text-[13px]" style={{ color: '#b91c1c' }}>
          {error}
        </p>
      )}
      <ConfirmDialog
        open={abierto}
        title="Cancelar suscripción"
        message={
          activaHasta
            ? `No se te va a cobrar más. Tu tienda sigue activa hasta el ${activaHasta} y después se suspende.`
            : 'No se te va a cobrar más y tu tienda se suspende al terminar el período que ya pagaste.'
        }
        confirmText="Sí, cancelar"
        cancelText="Volver"
        danger
        onConfirm={confirmar}
        onCancel={() => setAbierto(false)}
      />
    </div>
  )
}
