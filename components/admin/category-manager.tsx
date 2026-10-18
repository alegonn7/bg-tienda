'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Info, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ErrorText } from '@/components/admin/ui'
import { createCategory, deleteCategory, updateCategory } from '@/app/admin/actions'

export type CategoryRow = { id: string; name: string; products: number; visible: number }

// Colores que rotan en el cuadradito de cada categoría, solo para distinguirlas de un vistazo.
const TINTS = [
  ['#fde8f3', '#d81b8a'],
  ['#efeff0', '#55555c'],
  ['#fef3e2', '#b45309'],
  ['#e8efff', '#1d4ed8'],
  ['#f1ebff', '#7c3aed'],
  ['#e7f6ec', '#15803d'],
]

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<CategoryRow | null>(null)
  const [error, setError] = useState('')

  async function run(fn: () => Promise<void>) {
    setError('')
    try {
      await fn()
      router.refresh()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
      return false
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
      setError(`Ya tenés una categoría "${clean}".`)
      return
    }
    setAdding(true)
    if (await run(() => createCategory(clean))) setName('')
    setAdding(false)
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const current = categories.find((c) => c.id === editing.id)
    if (!editing.name.trim() || editing.name.trim() === current?.name) {
      setEditing(null)
      return
    }
    setSaving(true)
    if (await run(() => updateCategory(editing.id, editing.name))) setEditing(null)
    setSaving(false)
  }

  // En la tienda los filtros salen de los productos visibles, ordenados alfabéticamente.
  const inStore = categories.filter((c) => c.visible > 0).map((c) => c.name).sort((a, b) => a.localeCompare(b, 'es'))

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <ConfirmDialog
        open={!!deleting}
        title="Eliminar categoría"
        message={
          deleting
            ? deleting.products > 0
              ? `"${deleting.name}" tiene ${deleting.products} ${deleting.products === 1 ? 'producto' : 'productos'}. Si la eliminás, esos productos quedan sin categoría.`
              : `¿Eliminar "${deleting.name}"?`
            : ''
        }
        confirmText="Eliminar"
        danger
        onConfirm={async () => {
          const c = deleting
          setDeleting(null)
          if (c) await run(() => deleteCategory(c.id))
        }}
        onCancel={() => setDeleting(null)}
      />

      <div className="adm-card overflow-hidden">
        <form onSubmit={handleAdd} className="flex gap-2 p-3 md:p-4" style={{ borderBottom: '1px solid var(--adm-line2)' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nueva categoría, ej: Llaveros"
            className="adm-input min-w-0 flex-1"
            maxLength={60}
          />
          <button type="submit" disabled={adding || !name.trim()} className="adm-btn adm-btn-pri">
            <Plus />
            <span className="hidden sm:inline">{adding ? 'Agregando…' : 'Agregar'}</span>
          </button>
        </form>
        {error && (
          <div className="px-4 pt-3">
            <ErrorText>{error}</ErrorText>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Tag className="mx-auto h-6 w-6" style={{ color: 'var(--adm-soft)' }} />
            <p className="mt-2 text-[14px] font-medium">Todavía no tenés categorías</p>
            <p className="adm-hint mt-0.5">Agregá la primera arriba. Después la elegís al cargar cada producto.</p>
          </div>
        ) : (
          <ul>
            {categories.map((c, i) => {
              const [bg, fg] = TINTS[i % TINTS.length]
              const isEditing = editing?.id === c.id
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2.5 md:px-4"
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid var(--adm-line2)',
                    backgroundColor: isEditing ? '#fafaf8' : undefined,
                  }}
                >
                  <span
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[10px] text-[14px] font-semibold"
                    style={{ backgroundColor: bg, color: fg }}
                  >
                    {c.name.trim()[0]?.toUpperCase() ?? '?'}
                  </span>
                  {isEditing ? (
                    <form onSubmit={handleRename} className="flex min-w-0 flex-1 items-center gap-2">
                      <input
                        autoFocus
                        value={editing.name}
                        onChange={(e) => setEditing({ id: c.id, name: e.target.value })}
                        onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
                        className="adm-input min-w-0 flex-1"
                        maxLength={60}
                      />
                      <button type="submit" disabled={saving} className="adm-btn adm-btn-pri adm-btn-sm" aria-label="Guardar nombre">
                        <Check />
                      </button>
                      <button type="button" onClick={() => setEditing(null)} className="adm-btn adm-btn-ghost adm-btn-sm" aria-label="Cancelar">
                        <X />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium">{c.name}</p>
                        <p className="text-[12px]" style={{ color: 'var(--adm-muted)' }}>
                          {c.products === 0 ? (
                            <>
                              <span style={{ color: 'var(--adm-warn)' }}>Sin productos</span> · no se muestra en la tienda
                            </>
                          ) : c.visible === 0 ? (
                            <>
                              {c.products} {c.products === 1 ? 'producto' : 'productos'} ·{' '}
                              <span style={{ color: 'var(--adm-warn)' }}>ninguno visible</span>
                            </>
                          ) : (
                            `${c.products} ${c.products === 1 ? 'producto' : 'productos'}`
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setError('')
                          setEditing({ id: c.id, name: c.name })
                        }}
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        aria-label={`Cambiar nombre de ${c.name}`}
                      >
                        <Pencil />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(c)}
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        aria-label={`Eliminar ${c.name}`}
                      >
                        <Trash2 />
                      </button>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {categories.length > 0 && (
          <p className="flex items-start gap-2 px-4 py-3 text-[12px]" style={{ borderTop: '1px solid var(--adm-line2)', color: 'var(--adm-muted)' }}>
            <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
            En la tienda aparecen en orden alfabético y solo las que tienen productos visibles.
          </p>
        )}
      </div>

      <div className="adm-card">
        <div className="adm-card-h">
          <h3>Así se ve en tu tienda</h3>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {inStore.length === 0 ? (
            <p className="adm-hint">Ninguna categoría tiene productos visibles todavía.</p>
          ) : (
            <>
              <span className="adm-chip" data-on="true">
                Todo
              </span>
              {inStore.map((n) => (
                <span key={n} className="adm-chip">
                  {n}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
