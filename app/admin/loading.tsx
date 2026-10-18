// Se muestra al instante al navegar entre secciones del admin (el menú queda fijo) mientras el
// servidor trae los datos, en vez de dejar la pantalla congelada sin feedback.
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-4 md:px-7 md:pt-7" aria-busy="true" aria-live="polite">
      <div className="h-7 w-48 animate-pulse rounded-lg" style={{ backgroundColor: '#e9e9e6' }} />
      <div className="mt-3 h-4 w-32 animate-pulse rounded-lg" style={{ backgroundColor: '#ececea' }} />
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 w-full animate-pulse rounded-xl" style={{ backgroundColor: '#efefec' }} />
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
