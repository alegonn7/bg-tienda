'use client'

// Reemplaza confirm() nativo del navegador -- ese cuadro no se puede estilar y desentona con
// el resto del sitio. Mismo lenguaje visual que el resto del admin: esquinas rectas, borde
// negro, sin sombras.
type Props = {
  open: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title = 'Confirmar',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(17,17,17,0.4)' }}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-[400px] p-6"
        style={{ backgroundColor: '#fff', border: '1px solid #111111' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-medium" style={{ color: '#111111' }}>
          {title}
        </h2>
        <p className="mt-2 text-[14px]" style={{ color: '#6b6b6b' }}>
          {message}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-[13px]" style={{ color: '#6b6b6b' }}>
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-[13px]"
            style={
              danger
                ? { border: '1px solid #d81b8a', color: '#fff', backgroundColor: '#d81b8a' }
                : { border: '1px solid #111111', color: '#fff', backgroundColor: '#111111' }
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
