'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTransferSettings } from '@/app/admin/actions'

const inputStyle = {
  border: '1px solid #e5e5e5',
  backgroundColor: '#fff',
  color: '#111111',
} as const

const labelStyle = { letterSpacing: '0.06em', color: '#6b6b6b' } as const

type Props = {
  enabled: boolean
  cbu: string | null
  alias: string | null
  receiptEmail: string | null
}

export function TransferSettingsForm({ enabled, cbu, alias, receiptEmail }: Props) {
  const router = useRouter()
  const [cbuValue, setCbuValue] = useState(cbu ?? '')
  const [aliasValue, setAliasValue] = useState(alias ?? '')
  const [receiptEmailValue, setReceiptEmailValue] = useState(receiptEmail ?? '')
  const [checked, setChecked] = useState(enabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const hasData = !!(cbuValue.trim() || aliasValue.trim()) && !!receiptEmailValue.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      if (checked && !hasData) {
        throw new Error('Cargá CBU o alias, y el email para el comprobante, antes de habilitarlo.')
      }
      await updateTransferSettings({
        enabled: checked,
        cbu: cbuValue.trim(),
        alias: aliasValue.trim(),
        receiptEmail: receiptEmailValue.trim(),
      })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            CBU
          </label>
          <input
            type="text"
            value={cbuValue}
            onChange={(e) => setCbuValue(e.target.value)}
            placeholder="0000000000000000000000"
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            Alias
          </label>
          <input
            type="text"
            value={aliasValue}
            onChange={(e) => setAliasValue(e.target.value)}
            placeholder="mi.tienda.alias"
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          Email para el comprobante
        </label>
        <input
          type="email"
          value={receiptEmailValue}
          onChange={(e) => setReceiptEmailValue(e.target.value)}
          placeholder="tu-email@ejemplo.com"
          className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
          style={inputStyle}
        />
        <p className="mt-1 text-[12px]" style={{ color: '#6b6b6b' }}>
          Le decimos al cliente que mande la foto/PDF del comprobante acá. Podés usar tu email
          habitual.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="transfer_enabled"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="transfer_enabled" className="text-[14px]" style={{ color: '#111111' }}>
          Permitir pagar por transferencia en la tienda
        </label>
      </div>

      {error && (
        <p className="text-[13px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-[13px]" style={{ color: '#16a34a' }}>
          Guardado.
        </p>
      )}

      <button type="submit" disabled={saving} className="w-fit pc-btn px-6 py-3 text-[14px] disabled:opacity-60">
        {saving ? 'Guardando...' : 'Guardar →'}
      </button>
    </form>
  )
}
