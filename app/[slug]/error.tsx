'use client'

import { useEffect } from 'react'

// Boundary de errores para todo /[slug]/** (incluye /checkout y /pedido/[orderId]) -- sin esto,
// cualquier excepción no capturada en un Server Component de esta rama caía en el mensaje
// genérico de Next.js ("An error occurred in the Server Components render...", sin detalle en
// producción). Client Component porque error.tsx lo exige (necesita reset()).
export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[/[slug] error boundary]', error.digest, error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="text-[16px]" style={{ color: '#111111' }}>
        Uh, algo salió mal.
      </p>
      <p className="text-[14px]" style={{ color: '#6b6b6b' }}>
        Volvé a intentarlo en unos segundos. Si el problema sigue, contactanos y contanos qué
        estabas haciendo.
        {error.digest && (
          <>
            <br />
            Código: {error.digest}
          </>
        )}
      </p>
      <button type="button" onClick={() => reset()} className="pc-btn px-6 py-3 text-[14px]">
        Reintentar →
      </button>
    </div>
  )
}
