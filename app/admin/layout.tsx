import type { Metadata } from 'next'
import Link from 'next/link'
import { getAuthUser, getAdminOrgWithStatus, soloLectura } from '@/lib/tenant'
import { LogoutButton } from '@/components/admin/logout-button'
import { ModoLectura } from '@/components/admin/modo-lectura'
import { MP_SUSCRIPCIONES_URL, SuscripcionResumen, WHATSAPP_SOPORTE_URL } from '@/components/admin/suscripcion-resumen'

// El panel no tiene nada para buscadores (y robots.ts ya lo excluye); noindex por si algún link
// externo lo expone igual.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  if (!user) {
    // proxy.ts ya debería haber redirigido a /admin/login antes de llegar acá — esto es defensa
    // adicional, no el mecanismo principal.
    return <main>{children}</main>
  }

  const ctx = await getAdminOrgWithStatus()
  // pending: todavía no pagó, solo ve el estado del pago. suspended: panel en modo lectura.
  const bloqueado = ctx?.subscriptionStatus === 'pending'
  const lectura = !!ctx && soloLectura(ctx)

  return (
    <div style={{ backgroundColor: '#fafaf9', minHeight: '100vh' }}>
      <header
        className="flex flex-col gap-3 px-4 py-4 sm:px-8 md:flex-row md:items-center md:justify-between"
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e5e5',
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
          <span className="text-[15px] font-medium" style={{ color: '#111111' }}>
            {ctx ? `${ctx.storeName ?? ctx.organizationName} — Admin` : 'bg-tienda Admin'}
          </span>
          {ctx && !bloqueado && (
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Productos
              </Link>
              <Link href="/admin/pedidos" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Pedidos
              </Link>
              <Link href="/admin/categorias" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Categorías
              </Link>
              <Link href="/admin/tamanos" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Tamaños
              </Link>
              <Link href="/admin/hero" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Banner
              </Link>
              <Link href="/admin/personalizacion" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Personalización
              </Link>
              <Link href="/admin/configuracion" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Configuración
              </Link>
              {ctx.plan === 'tienda' && (
                <Link href="/admin/suscripcion" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                  Mi suscripción
                </Link>
              )}
            </nav>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[13px] break-all" style={{ color: '#6b6b6b' }}>
            {user.email}
          </span>
          {ctx && !bloqueado && !lectura && (
            <Link href={`/${ctx.organizationSlug}`} className="text-[13px]" style={{ color: '#6b6b6b' }}>
              Ver tienda →
            </Link>
          )}
          <LogoutButton />
        </div>
      </header>
      <main>
        {ctx && bloqueado ? (
          <CuentaBloqueada organizationId={ctx.organizationId} subscriptionStatus={ctx.subscriptionStatus} />
        ) : ctx ? (
          <>
            {ctx.subscriptionStatus === 'past_due' && <AvisoPagoAtrasado />}
            {lectura && <AvisoSuspendida />}
            <ModoLectura activo={lectura}>{children}</ModoLectura>
          </>
        ) : (
          <div className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-8">
            <h1 className="text-[22px] font-medium" style={{ color: '#111111' }}>
              Tu organización todavía no tiene bg-tienda habilitada
            </h1>
            <p className="mt-3 text-[14px]" style={{ color: '#6b6b6b' }}>
              Pedile a un super-admin que habilite la tienda online para tu organización desde
              admin-gestion antes de poder gestionar productos acá.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

// Cuenta que todavía no pagó (pending): la tienda pública no se ve (vista store_directory) y el
// panel solo muestra el estado del pago.
function CuentaBloqueada({
  organizationId,
  subscriptionStatus,
}: {
  organizationId: string
  subscriptionStatus: string | null
}) {
  return (
    <div className="mx-auto max-w-[700px] px-4 py-14 sm:px-8">
      <h1 className="text-[22px] font-medium" style={{ color: '#111111' }}>
        Todavía no confirmamos tu pago
      </h1>
      <p className="mt-3 text-[14px]" style={{ color: '#6b6b6b' }}>
        Apenas Mercado Pago confirme el primer pago, tu tienda se activa sola y vas a poder cargar productos. Si ya
        pagaste, esperá unos minutos y recargá esta página.
      </p>
      <p className="mt-3 text-[14px]" style={{ color: '#6b6b6b' }}>
        Podés revisar tu tarjeta en{' '}
        <a href={MP_SUSCRIPCIONES_URL} className="underline" target="_blank" rel="noreferrer">
          tus suscripciones de Mercado Pago
        </a>{' '}
        o{' '}
        <a href={WHATSAPP_SOPORTE_URL} className="underline" target="_blank" rel="noreferrer">
          escribirnos por WhatsApp
        </a>
        .
      </p>
      <div className="mt-8 p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <SuscripcionResumen organizationId={organizationId} subscriptionStatus={subscriptionStatus} />
      </div>
    </div>
  )
}

// Cuenta suspendida (canceló y venció el mes pago, o dejó de pagar): la tienda no se ve y el panel
// queda en modo lectura hasta que reactive.
function AvisoSuspendida() {
  return (
    <div
      className="sticky top-0 z-40 px-4 py-3 text-[13px] sm:px-8"
      style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}
    >
      Tu suscripción está suspendida y tu tienda no se ve online. Podés mirar todo, pero para volver a editar y
      publicar tu tienda tenés que{' '}
      <Link href="/admin/suscripcion" className="font-medium underline">
        reactivar la suscripción
      </Link>
      .
    </div>
  )
}

function AvisoPagoAtrasado() {
  return (
    <div className="px-4 py-3 text-[13px] sm:px-8" style={{ backgroundColor: '#fef3c7', color: '#78350f' }}>
      No pudimos cobrar la cuota de este mes. Tu tienda sigue online mientras Mercado Pago reintenta el cobro; revisá tu tarjeta en{' '}
      <a href={MP_SUSCRIPCIONES_URL} className="underline" target="_blank" rel="noreferrer">
        Mercado Pago
      </a>{' '}
      para que no se suspenda. <Link href="/admin/suscripcion" className="underline">Ver mi suscripción</Link>
    </div>
  )
}
