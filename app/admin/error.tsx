'use client'

import { useEffect } from 'react'

// Boundary de errores para todo /admin/** -- hasta ahora solo existía el de /[slug]/**
// (la tienda), así que cualquier excepción acá caía en el mensaje genérico de Next.js
// ("An error occurred in the Server Components render...", sin detalle en producción).
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[/admin error boundary]', error.digest, error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="text-[16px]" style={{ color: '#111111' }}>
        Uh, algo salió mal.
      </p>
      <p className="text-[14px]" style={{ color: '#6b6b6b' }}>
        Volvé a intentarlo en unos segundos.
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
