'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PAGE_SIZE = 20

type Item = { id: string; name: string }

type Props = {
  items: Item[]
  onAdd: (name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  placeholder: string
}

export function ManageList({ items, onAdd, onDelete, placeholder }: Props) {
  const [value, setValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const router = useRouter()

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setAdding(true)
    setError('')
    try {
      await onAdd(value.trim())
      setValue('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    try {
      await onDelete(id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 text-[14px] outline-none"
          style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#111111' }}
        />
        <button
          type="submit"
          disabled={adding || !value.trim()}
          className="pc-btn px-5 py-2.5 text-[13px] disabled:opacity-50"
        >
          {adding ? 'Agregando...' : '+ Agregar'}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-[13px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}

      <ul className="mt-4" style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff' }}>
        {items.length === 0 ? (
          <li className="px-5 py-4 text-[14px]" style={{ color: '#6b6b6b' }}>
            No hay ninguna todavía.
          </li>
        ) : (
          paged.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-5 py-3.5"
              style={{
                borderTop: i === 0 ? 'none' : '1px solid #e5e5e5',
              }}
            >
              <span className="text-[14px]" style={{ color: '#111111' }}>
                {item.name}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id, item.name)}
                className="text-[13px]"
                style={{ color: '#d81b8a' }}
              >
                Eliminar
              </button>
            </li>
          ))
        )}
      </ul>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-[13px] disabled:opacity-40"
            style={{ border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
          >
            ← Anterior
          </button>
          <span className="text-[13px]" style={{ color: '#6b6b6b' }}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-[13px] disabled:opacity-40"
            style={{ border: '1px solid #e5e5e5', color: '#111111', backgroundColor: '#fff' }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
