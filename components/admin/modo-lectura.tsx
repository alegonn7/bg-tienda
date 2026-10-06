'use client'

import { usePathname } from 'next/navigation'

// Cuenta suspendida: el panel se ve pero no se puede tocar. Un <fieldset disabled> deshabilita de
// una vez todos los inputs y botones de adentro (los links siguen andando para navegar). Mi
// suscripción queda afuera porque ahí está el botón para reactivar. Los server actions igual lo
// bloquean del lado del servidor (getOrgParaEditar), esto es para que se entienda en pantalla.
export function ModoLectura({ activo, children }: { activo: boolean; children: React.ReactNode }) {
  const pathname = usePathname()
  if (!activo || pathname.startsWith('/admin/suscripcion')) return <>{children}</>

  return (
    <fieldset disabled className="m-0 min-w-0 border-0 p-0">
      {children}
    </fieldset>
  )
}
