import { notFound } from 'next/navigation'
import { getAdminOrgWithStatus } from '@/lib/tenant'
import { SuscripcionResumen } from '@/components/admin/suscripcion-resumen'
import { SincronizarReactivacion } from '@/components/admin/reactivar-suscripcion'
import { Page, PageHeader } from '@/components/admin/ui'

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
    <Page width={1080}>
      <PageHeader sub title="Mi suscripción" description="Tu plan de BG Tienda y tus pagos." />
      {reactivar && ctx.role === 'owner' && <SincronizarReactivacion />}
      <SuscripcionResumen organizationId={ctx.organizationId} subscriptionStatus={ctx.subscriptionStatus} esDueno={ctx.role === 'owner'} />
    </Page>
  )
}
