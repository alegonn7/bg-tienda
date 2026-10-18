'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Plus, Ruler, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ErrorText } from '@/components/admin/ui'
import { createSize, deleteSize } from '@/app/admin/actions'

export type SizeRow = { id: string; name: string; products: number }

export function SizesManager({ sizes }: { sizes: SizeRow[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<SizeRow | null>(null)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    // Se pueden cargar varios de una: "S, M, L".
    const names = name
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
    const fresh = names.filter((n, i) => names.indexOf(n) === i && !sizes.some((s) => s.name.toLowerCase() === n.toLowerCase()))
    if (fresh.length === 0) {
      setError(names.length ? 'Ya tenés esos tamaños cargados.' : '')
      return
    }
    setAdding(true)
    setError('')
    try {
      for (const n of fresh) await createSize(n)
      setName('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(s: SizeRow) {
    setDeleting(null)
    setError('')
    try {
      await deleteSize(s.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.')
    }
  }

  return (
    <div className="adm-card overflow-hidden">
      <ConfirmDialog
        open={!!deleting}
        title="Eliminar tamaño"
        message={
          deleting
            ? deleting.products > 0
              ? `"${deleting.name}" está en ${deleting.products} ${deleting.products === 1 ? 'producto' : 'productos'}. Los productos lo siguen mostrando hasta que lo saques de cada uno, pero ya no vas a poder elegirlo para productos nuevos.`
              : `¿Eliminar "${deleting.name}"?`
            : ''
        }
        confirmText="Eliminar"
        danger
        onConfirm={() => deleting && handleDelete(deleting)}
        onCancel={() => setDeleting(null)}
      />

      <form onSubmit={handleAdd} className="flex gap-2 p-3 md:p-4" style={{ borderBottom: '1px solid var(--adm-line2)' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nuevo tamaño, ej: XL o 30×40 cm"
          className="adm-input min-w-0 flex-1"
          maxLength={120}
        />
        <button type="submit" disabled={adding || !name.trim()} className="adm-btn adm-btn-pri">
          <Plus />
          <span className="hidden sm:inline">{adding ? 'Agregando…' : 'Agregar'}</span>
        </button>
      </form>

      <div className="p-3 md:p-4">
        <ErrorText>{error}</ErrorText>
        {sizes.length === 0 ? (
          <div className="py-8 text-center">
            <Ruler className="mx-auto h-6 w-6" style={{ color: 'var(--adm-soft)' }} />
            <p className="mt-2 text-[14px] font-medium">Todavía no tenés tamaños</p>
            <p className="adm-hint mt-0.5">Podés cargar varios juntos separados por coma: S, M, L, XL.</p>
          </div>
        ) : (
          <div className={`flex flex-wrap gap-2 ${error ? 'mt-3' : ''}`}>
            {sizes.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-[9px] py-1.5 pl-3 pr-1.5 text-[13px]"
                style={{ border: '1px solid var(--adm-line)', backgroundColor: '#fff' }}
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-[11px]" style={{ color: 'var(--adm-soft)' }} title="Productos que lo usan">
                  {s.products}
                </span>
                <button
                  type="button"
                  onClick={() => setDeleting(s)}
                  className="grid h-5 w-5 place-items-center rounded-full hover:bg-black/5"
                  aria-label={`Eliminar ${s.name}`}
                >
                  <X className="h-3 w-3" style={{ color: 'var(--adm-muted)' }} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      {sizes.length > 0 && (
        <p className="flex items-start gap-2 px-4 py-3 text-[12px]" style={{ borderTop: '1px solid var(--adm-line2)', color: 'var(--adm-muted)' }}>
          <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
          El número al lado de cada uno es en cuántos productos está. Tip: podés cargar varios juntos separados por coma.
        </p>
      )}
    </div>
  )
}
