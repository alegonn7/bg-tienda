'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateWhatsAppOrdersEnabled } from '@/app/admin/actions'

export function WhatsAppOrdersForm({ enabled, hasWhatsappNumber }: { enabled: boolean; hasWhatsappNumber: boolean }) {
  const router = useRouter()
  const [checked, setChecked] = useState(enabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleToggle(next: boolean) {
    setChecked(next)
    setSaving(true)
    setError('')
    try {
      await updateWhatsAppOrdersEnabled(next)
      router.refresh()
    } catch (err) {
      setChecked(!next)
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="whatsapp_orders_enabled"
          checked={checked}
          disabled={!hasWhatsappNumber || saving}
          onChange={(e) => handleToggle(e.target.checked)}
          className="h-4 w-4"
        />
        <label
          htmlFor="whatsapp_orders_enabled"
          className="text-[14px]"
          style={{ color: hasWhatsappNumber ? '#111111' : '#6b6b6b' }}
        >
          Permitir hacer pedidos por WhatsApp desde la tienda
        </label>
      </div>
      {!hasWhatsappNumber && (
        <p className="text-[12px]" style={{ color: '#6b6b6b' }}>
          Para habilitar esto primero cargá tu número de WhatsApp en Personalización.
        </p>
      )}
      {error && (
        <p className="text-[13px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}
    </div>
  )
}
