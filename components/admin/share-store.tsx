'use client'

import { useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'

export function ShareStore({ url, storeName }: { url: string; storeName: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de portapapeles (iframe, navegador viejo): el link igual queda a la vista.
    }
  }

  const waText = encodeURIComponent(`Mirá ${storeName}: ${url}`)

  return (
    <div className="flex flex-wrap items-center gap-2 p-3.5 md:flex-nowrap md:px-[18px] md:py-4">
      <div
        className="w-full min-w-0 truncate rounded-[10px] px-3 py-2 text-[13px] md:w-auto md:flex-1"
        style={{ backgroundColor: 'var(--adm-bg)', border: '1px solid var(--adm-line)', color: '#3b3b42' }}
      >
        {url.replace(/^https?:\/\//, '')}
      </div>
      <button type="button" onClick={copy} className="adm-btn adm-btn-sm flex-1 md:flex-none">
        {copied ? <Check /> : <Copy />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noreferrer"
        className="adm-btn adm-btn-sm adm-btn-acc flex-1 md:flex-none"
      >
        <MessageCircle />
        WhatsApp
      </a>
    </div>
  )
}
