'use client'

// Reemplaza confirm() nativo del navegador -- ese cuadro no se puede estilar y desentona con
// el resto del panel. En el celular sube desde abajo (bottom sheet), en compu queda centrado.
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
      className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:px-6"
      style={{ backgroundColor: 'rgba(17,17,17,0.4)' }}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-[420px] rounded-t-2xl bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-xl md:rounded-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[17px] font-semibold" style={{ color: '#16161a' }}>
          {title}
        </h2>
        <p className="mt-2 text-[14px]" style={{ color: '#6b6b72' }}>
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <button type="button" onClick={onCancel} className="adm-btn">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="adm-btn"
            style={
              danger
                ? { backgroundColor: '#b91c1c', borderColor: '#b91c1c', color: '#fff' }
                : { backgroundColor: '#16161a', borderColor: '#16161a', color: '#fff' }
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
