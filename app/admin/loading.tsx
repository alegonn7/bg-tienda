// Se muestra al instante al navegar entre secciones del admin (el header del layout queda fijo)
// mientras el servidor trae los datos, en vez de dejar la pantalla congelada sin feedback.
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-10" aria-busy="true" aria-live="polite">
      <div className="h-7 w-48 animate-pulse" style={{ backgroundColor: '#ececea' }} />
      <div className="mt-3 h-4 w-32 animate-pulse" style={{ backgroundColor: '#f0f0ee' }} />
      <div className="mt-10 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 w-full animate-pulse" style={{ backgroundColor: '#f3f3f1' }} />
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
