'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

// URL del feed de Google Merchant Center con botón de copiar (el resto de la tarjeta es server).
export function CopyFeedUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de portapapeles: la URL igual queda a la vista para copiarla a mano.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
      <div
        className="w-full min-w-0 select-all break-all rounded-[10px] px-3 py-2 font-mono text-[12.5px] md:flex-1"
        style={{ backgroundColor: 'var(--adm-bg)', border: '1px solid var(--adm-line)', color: '#3b3b42' }}
      >
        {url}
      </div>
      <button type="button" onClick={copy} className="adm-btn adm-btn-sm w-full md:w-auto">
        {copied ? <Check /> : <Copy />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
