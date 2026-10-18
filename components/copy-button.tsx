'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Sin permiso para el portapapeles: el dato igual queda a la vista para copiarlo a mano.
    }
  }

  return (
    <button type="button" onClick={copy} aria-label={`Copiar ${label}`} className="st-btn st-btn-sm st-btn-ghost ml-auto flex-shrink-0 !px-3">
      {copied ? <Check className="!h-[15px] !w-[15px]" style={{ color: 'var(--st-ok)' }} /> : <Copy className="!h-[15px] !w-[15px]" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}
