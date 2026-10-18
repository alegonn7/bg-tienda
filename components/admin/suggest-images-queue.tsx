'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ImageCandidate } from '@/lib/image-search'
import { getImageSuggestions, getInitialImageSuggestions, assignProductImage } from '@/app/admin/actions'

type QueueProduct = { id: string; name: string; category: string }

export function SuggestImagesQueue({ products }: { products: QueueProduct[] }) {
  const [remaining, setRemaining] = useState(products)
  const [done, setDone] = useState(0)
  const total = products.length
  const current = remaining[0]

  const [query, setQuery] = useState(current?.name ?? '')
  const [candidates, setCandidates] = useState<ImageCandidate[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')
  const [translated, setTranslated] = useState(false)

  useEffect(() => {
    if (!current) return
    setSelected(null)
    setTranslated(false)
    runInitialSearch(current.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  // Búsqueda automática al entrar a un producto — traduce el nombre (en español) antes de buscar,
  // porque Pexels indexa mayormente en inglés (ver lib/image-search.ts). Actualiza el cuadro de
  // texto con lo que realmente se buscó, para que no quede desincronizado de los resultados.
  async function runInitialSearch(name: string) {
    setSearching(true)
    setError('')
    setCandidates([])
    try {
      const result = await getInitialImageSuggestions(name)
      setQuery(result.query)
      setTranslated(result.query.trim().toLowerCase() !== name.trim().toLowerCase())
      setCandidates(result.candidates)
    } catch (err) {
      setQuery(name)
      setError(err instanceof Error ? err.message : 'Error buscando imágenes')
    } finally {
      setSearching(false)
    }
  }

  // Búsqueda manual (botón "Buscar" / Enter) — respeta exactamente lo que el admin escribió, sin
  // volver a traducir, para no pisarle un texto que ya eligió a propósito.
  async function runSearch(text: string) {
    if (!text.trim()) return
    setSearching(true)
    setError('')
    setCandidates([])
    setTranslated(false)
    try {
      const results = await getImageSuggestions(text)
      setCandidates(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error buscando imágenes')
    } finally {
      setSearching(false)
    }
  }

  const selectedCandidate = candidates.find((c) => c.imageUrl === selected)

  function skip() {
    setRemaining((prev) => prev.slice(1))
  }

  async function useSelected() {
    if (!current || !selected) return
    setAssigning(true)
    setError('')
    try {
      await assignProductImage(current.id, selected)
      setDone((d) => d + 1)
      setRemaining((prev) => prev.slice(1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando la imagen')
    } finally {
      setAssigning(false)
    }
  }

  if (!current) {
    return (
      <div className="adm-card px-5 py-14 text-center">
        <p className="text-[15px] font-medium">
          {total === 0 ? 'Todos tus productos tienen foto.' : `Listo: le pusiste foto a ${done} de ${total} productos.`}
        </p>
        <Link href="/admin/productos" className="adm-btn mt-4">
          Volver a productos
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: '#e9e9e6' }}>
          <div className="h-full rounded-full" style={{ width: `${((total - remaining.length) / Math.max(1, total)) * 100}%`, backgroundColor: 'var(--adm-ink)' }} />
        </div>
        <span className="text-[13px]" style={{ color: 'var(--adm-muted)' }}>
          Quedan {remaining.length} de {total}
        </span>
      </div>

      <div className="adm-card p-4 md:p-6">
        <p className="text-[12px]" style={{ color: 'var(--adm-muted)' }}>
          {current.category || 'Sin categoría'}
        </p>
        <h2 className="text-[18px] font-semibold">{current.name}</h2>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setTranslated(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && runSearch(query)}
            placeholder="Texto de búsqueda"
            className="adm-input min-w-0 flex-1"
          />
          <button type="button" onClick={() => runSearch(query)} disabled={searching} className="adm-btn">
            Buscar
          </button>
        </div>

        {translated && (
          <p className="mt-1 text-[12px]" style={{ color: 'var(--adm-soft)' }}>
            Traducido automáticamente del nombre del producto. Lo podés editar.
          </p>
        )}

        {error && (
          <p className="mt-3 text-[13px]" style={{ color: 'var(--adm-bad)' }}>
            {error}
          </p>
        )}

        <div className="mt-4">
          {searching ? (
            <p className="py-10 text-center text-[13px]" style={{ color: 'var(--adm-muted)' }}>
              Buscando…
            </p>
          ) : candidates.length === 0 ? (
            <p className="py-10 text-center text-[13px]" style={{ color: 'var(--adm-muted)' }}>
              Sin resultados. Probá con otro texto de búsqueda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {candidates.map((c) => (
                <button
                  key={c.imageUrl}
                  type="button"
                  onClick={() => setSelected(c.imageUrl)}
                  className="aspect-square overflow-hidden rounded-[10px]"
                  style={{
                    boxShadow: selected === c.imageUrl ? '0 0 0 3px var(--adm-accent)' : 'none',
                    border: '1px solid var(--adm-line)',
                  }}
                  title={c.photographer ? `${c.title} — Foto de ${c.photographer} en Pexels` : c.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.thumbnailUrl} alt={c.title} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 grid gap-1 text-[12px]" style={{ color: 'var(--adm-muted)' }}>
          {selectedCandidate && (
            <p>
              Foto de{' '}
              <a href={selectedCandidate.photographerUrl} target="_blank" rel="noopener noreferrer" className="underline">
                {selectedCandidate.photographer || 'autor desconocido'}
              </a>{' '}
              en{' '}
              <a href={selectedCandidate.contextLink} target="_blank" rel="noopener noreferrer" className="underline">
                Pexels
              </a>
            </p>
          )}
          <p>Fijate que la imagen sea apropiada para tu tienda antes de usarla: la búsqueda no filtra derechos de autor.</p>
          <p style={{ color: 'var(--adm-soft)' }}>
            Fotos provistas por{' '}
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline">
              Pexels
            </a>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--adm-line2)' }}>
          <button type="button" onClick={useSelected} disabled={!selected || assigning} className="adm-btn adm-btn-pri">
            {assigning ? 'Guardando…' : 'Usar esta foto'}
          </button>
          <button type="button" onClick={skip} disabled={assigning} className="adm-btn adm-btn-ghost">
            Saltar
          </button>
          <Link href={`/admin/productos/${current.id}/editar`} className="adm-btn adm-btn-ghost ml-auto">
            Subir la mía
          </Link>
        </div>
      </div>
    </div>
  )
}
