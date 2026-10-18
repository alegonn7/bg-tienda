import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Piezas chicas que comparten todas las pantallas del panel. Los estilos viven en globals.css
// (clases adm-*); acá solo se arma el markup para no repetirlo en cada página.

export function PageHeader({
  title,
  description,
  actions,
  back,
  sub,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  // Solo en compu: en el celular la flecha para volver ya está en la barra de arriba.
  back?: { href: string; label: string }
  // Pantallas secundarias: en el celular el título ya está en la barra de arriba, no se repite.
  sub?: boolean
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-1 hidden items-center gap-1 text-[13px] md:inline-flex"
            style={{ color: 'var(--adm-muted)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className={`${sub ? 'hidden md:block' : ''} text-[21px] font-semibold tracking-[-0.01em] md:text-[24px]`}>{title}</h1>
        {description && <p className="mt-0.5 adm-hint md:text-[14px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

// Contenedor de cada página: ancho máximo y márgenes. pb extra en el celular para que la barra
// de abajo (y las barras de guardar fijas) no tapen el final.
export function Page({ children, width = 1240 }: { children: React.ReactNode; width?: number }) {
  return (
    <div className="mx-auto w-full px-4 pb-28 pt-4 md:px-7 md:pb-10 md:pt-7" style={{ maxWidth: width }}>
      {children}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-[34px] flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
      style={{ backgroundColor: checked ? 'var(--adm-ok)' : '#d9d9d6' }}
    >
      <span
        className="absolute h-4 w-4 rounded-full bg-white shadow-sm transition-[left]"
        style={{ left: checked ? 16 : 2 }}
      />
    </button>
  )
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="adm-label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[12px]" style={{ color: 'var(--adm-soft)' }}>{hint}</p>}
    </div>
  )
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <p className="text-[13px]" style={{ color: 'var(--adm-bad)' }}>
      {children}
    </p>
  )
}

export function SuccessText({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <p className="text-[13px]" style={{ color: 'var(--adm-ok)' }}>
      {children}
    </p>
  )
}

// Las iniciales del nombre de un cliente para el círculo de la lista de pedidos.
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function Avatar({ name, size = 32 }: { name: string | null | undefined; size?: number }) {
  return (
    <span
      className="inline-grid flex-shrink-0 place-items-center rounded-full text-[12px] font-semibold"
      style={{ width: size, height: size, backgroundColor: '#ececea', color: '#3b3b42' }}
    >
      {initials(name)}
    </span>
  )
}
