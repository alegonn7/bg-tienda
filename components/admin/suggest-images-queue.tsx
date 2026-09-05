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
      <div className="py-16 text-center">
        <p className="text-[15px]" style={{ color: '#111111' }}>
          {total === 0
            ? 'No hay productos sin imagen.'
            : `Listo — asignaste imagen a ${done} de ${total} productos.`}
        </p>
        <Link href="/admin" className="mt-4 inline-block text-[13px]" style={{ color: '#d81b8a' }}>
          ← Volver a productos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-[13px]" style={{ color: '#6b6b6b' }}>
        Quedan {remaining.length} de {total}
      </p>

      <div className="p-6" style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff' }}>
        <p className="text-[12px] uppercase" style={{ letterSpacing: '0.06em', color: '#6b6b6b' }}>
          {current.category || 'Sin categoría'}
        </p>
        <h2 className="mt-1 text-[18px] font-medium" style={{ color: '#111111' }}>
          {current.name}
        </h2>

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
            className="flex-1 px-3 py-2 text-[14px] outline-none"
            style={{ border: '1px solid #e5e5e5', color: '#111111' }}
          />
          <button
            type="button"
            onClick={() => runSearch(query)}
            disabled={searching}
            className="px-4 py-2 text-[13px] disabled:opacity-60"
            style={{ border: '1px solid #111111', color: '#111111', backgroundColor: '#fff' }}
          >
            Buscar
          </button>
        </div>

        {translated && (
          <p className="mt-1 text-[11px]" style={{ color: '#6b6b6b' }}>
            Traducido automáticamente del nombre del producto — lo podés editar.
          </p>
        )}

        {error && (
          <p className="mt-3 text-[13px]" style={{ color: '#d81b8a' }}>
            {error}
          </p>
        )}

        <div className="mt-4">
          {searching ? (
            <p className="py-8 text-center text-[13px]" style={{ color: '#6b6b6b' }}>
              Buscando...
            </p>
          ) : candidates.length === 0 ? (
            <p className="py-8 text-center text-[13px]" style={{ color: '#6b6b6b' }}>
              Sin resultados. Probá con otro texto de búsqueda.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {candidates.map((c) => (
                <button
                  key={c.imageUrl}
                  type="button"
                  onClick={() => setSelected(c.imageUrl)}
                  className="aspect-square overflow-hidden"
                  style={{ border: selected === c.imageUrl ? '3px solid #d81b8a' : '1px solid #e5e5e5' }}
                  title={c.photographer ? `${c.title} — Foto de ${c.photographer} en Pexels` : c.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.thumbnailUrl} alt={c.title} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCandidate && (
          <p className="mt-3 text-[12px]" style={{ color: '#6b6b6b' }}>
            Foto de{' '}
            <a href={selectedCandidate.photographerUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
              {selectedCandidate.photographer || 'autor desconocido'}
            </a>{' '}
            en{' '}
            <a href={selectedCandidate.contextLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
              Pexels
            </a>
          </p>
        )}

        <p className="mt-2 text-[12px]" style={{ color: '#6b6b6b' }}>
          Fijate que la imagen sea apropiada para tu tienda antes de usarla — la búsqueda no filtra derechos de autor.
        </p>

        <p className="mt-2 text-[11px]" style={{ color: '#9b9b9b' }}>
          Fotos provistas por{' '}
          <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
            Pexels
          </a>
        </p>

        <div className="mt-4 flex items-center gap-4 pt-4" style={{ borderTop: '1px solid #e5e5e5' }}>
          <button
            type="button"
            onClick={useSelected}
            disabled={!selected || assigning}
            className="pc-btn px-5 py-2.5 text-[13px] disabled:opacity-60"
          >
            {assigning ? 'Guardando...' : 'Usar esta imagen →'}
          </button>
          <button
            type="button"
            onClick={skip}
            disabled={assigning}
            className="text-[13px] disabled:opacity-60"
            style={{ color: '#6b6b6b' }}
          >
            Saltar
          </button>
          <Link href={`/admin/productos/${current.id}/editar`} className="text-[13px]" style={{ color: '#6b6b6b' }}>
            Subir la mía →
          </Link>
        </div>
      </div>
    </div>
  )
}
