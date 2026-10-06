import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminOrgWithStatus } from '@/lib/tenant'
import { SuscripcionResumen } from '@/components/admin/suscripcion-resumen'
import { SincronizarReactivacion } from '@/components/admin/reactivar-suscripcion'

export default async function SuscripcionPage({
  searchParams,
}: {
  // ?reactivar=1: vuelta de Mercado Pago después de reactivar (back_url de reactivar-suscripcion).
  searchParams: Promise<{ reactivar?: string }>
}) {
  const { reactivar } = await searchParams
  // Sin filtro de estado: también la ve (desde el layout) una cuenta suspendida.
  const ctx = await getAdminOrgWithStatus()
  if (!ctx) notFound()

  return (
    <div className="mx-auto max-w-[700px] px-4 py-10 sm:px-8">
      <div className="mb-8">
        <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
          ← Volver
        </Link>
        <h1 className="mt-4 text-[24px] font-medium" style={{ color: '#111111' }}>
          Mi suscripción
        </h1>
      </div>

      {reactivar && ctx.role === 'owner' && <SincronizarReactivacion />}

      <div className="p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <SuscripcionResumen
          organizationId={ctx.organizationId}
          subscriptionStatus={ctx.subscriptionStatus}
          esDueno={ctx.role === 'owner'}
        />
      </div>
    </div>
  )
}
