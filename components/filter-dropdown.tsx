'use client'

import { useEffect, useRef, useState } from 'react'

export function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: string[]
  selected: Set<string>
  onToggle: (option: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = selected.size

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 text-[12px] uppercase"
        style={{
          letterSpacing: '0.04em',
          border: `1px solid ${count > 0 ? '#111111' : '#e5e5e5'}`,
          backgroundColor: count > 0 ? '#111111' : '#fff',
          color: count > 0 ? '#fff' : '#111111',
        }}
      >
        {label}{count > 0 ? ` (${count})` : ''}
        <span aria-hidden="true" style={{ fontSize: '10px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-2 max-h-72 w-64 overflow-y-auto"
          style={{ border: '1px solid #e5e5e5', backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
        >
          {count > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="w-full px-4 py-2.5 text-left text-[12px] uppercase"
              style={{ borderBottom: '1px solid #e5e5e5', color: '#d81b8a', letterSpacing: '0.04em' }}
            >
              Limpiar selección
            </button>
          )}
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px]"
              style={{ color: '#111111' }}
            >
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => onToggle(opt)}
                className="h-4 w-4"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
