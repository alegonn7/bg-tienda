import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getAdminOrgWithStatus, soloLectura } from '@/lib/tenant'
import { countOrdersNeedingAttention } from '@/lib/orders'
import { LogoutButton } from '@/components/admin/logout-button'
import { DesktopTopBar, MobileTabBar, MobileTopBar, Sidebar, StoreLogo, type NavStore } from '@/components/admin/admin-nav'
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
    return <main className="adm min-h-screen">{children}</main>
  }

  const ctx = await getAdminOrgWithStatus()
  // pending: todavía no pagó, solo ve el estado del pago. suspended: panel en modo lectura.
  const bloqueado = ctx?.subscriptionStatus === 'pending'
  const lectura = !!ctx && soloLectura(ctx)

  if (!ctx || bloqueado) {
    return (
      <div className="adm min-h-screen">
        <header
          className="flex items-center gap-3 px-4 py-3 md:px-8"
          style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--adm-line)' }}
        >
          <StoreLogo name={ctx?.storeName ?? ctx?.organizationName ?? 'BG Tienda'} logoUrl={ctx?.logoUrl ?? null} size={30} />
          <b className="min-w-0 flex-1 truncate text-[15px]">{ctx ? ctx.storeName ?? ctx.organizationName : 'BG Tienda'}</b>
          <span className="hidden text-[13px] sm:inline" style={{ color: 'var(--adm-muted)' }}>
            {user.email}
          </span>
          <LogoutButton />
        </header>
        <main>
          {ctx ? (
            <CuentaBloqueada organizationId={ctx.organizationId} subscriptionStatus={ctx.subscriptionStatus} />
          ) : (
            <div className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-8">
              <h1 className="text-[22px] font-semibold">Tu organización todavía no tiene bg-tienda habilitada</h1>
              <p className="mt-3 adm-hint text-[14px]">
                Pedile a un super-admin que habilite la tienda online para tu organización desde
                admin-gestion antes de poder gestionar productos acá.
              </p>
            </div>
          )}
        </main>
      </div>
    )
  }

  const supabase = await createClient()
  const pendingOrders = await countOrdersNeedingAttention(supabase).catch(() => 0)
  const store: NavStore = {
    name: ctx.storeName ?? ctx.organizationName,
    logoUrl: ctx.logoUrl,
    slug: ctx.organizationSlug,
    email: user.email,
    pendingOrders,
    showSubscription: ctx.plan === 'tienda',
    storeOnline: !lectura,
  }

  return (
    <div className="adm flex min-h-screen">
      <Sidebar store={store} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DesktopTopBar store={store} />
        <MobileTopBar store={store} />
        {ctx.subscriptionStatus === 'past_due' && <AvisoPagoAtrasado />}
        {lectura && <AvisoSuspendida />}
        <main className="flex-1">
          <ModoLectura activo={lectura}>{children}</ModoLectura>
        </main>
      </div>
      <MobileTabBar store={store} />
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
    <div className="mx-auto max-w-[1000px] px-4 py-14 sm:px-8">
      <h1 className="text-[22px] font-semibold">Todavía no confirmamos tu pago</h1>
      <p className="mt-3 adm-hint text-[14px]">
        Apenas Mercado Pago confirme el primer pago, tu tienda se activa sola y vas a poder cargar productos. Si ya
        pagaste, esperá unos minutos y recargá esta página.
      </p>
      <p className="mt-3 adm-hint text-[14px]">
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
      <div className="mt-8">
        <SuscripcionResumen organizationId={organizationId} subscriptionStatus={subscriptionStatus} />
      </div>
    </div>
  )
}

// Cuenta suspendida (canceló y venció el mes pago, o dejó de pagar): la tienda no se ve y el panel
// queda en modo lectura hasta que reactive.
function AvisoSuspendida() {
  return (
    <div className="px-4 py-3 text-[13px] md:px-7" style={{ backgroundColor: 'var(--adm-bad-soft)', color: '#7f1d1d' }}>
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
    <div className="px-4 py-3 text-[13px] md:px-7" style={{ backgroundColor: 'var(--adm-warn-soft)', color: '#78350f' }}>
      No pudimos cobrar la cuota de este mes. Tu tienda sigue online mientras Mercado Pago reintenta el cobro; revisá tu tarjeta en{' '}
      <a href={MP_SUSCRIPCIONES_URL} className="underline" target="_blank" rel="noreferrer">
        Mercado Pago
      </a>{' '}
      para que no se suspenda. <Link href="/admin/suscripcion" className="underline">Ver mi suscripción</Link>
    </div>
  )
}
