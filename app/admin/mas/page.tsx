import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAdminOrgWithStatus, getAuthUser, soloLectura } from '@/lib/tenant'
import { StoreLogo } from '@/components/admin/admin-nav'
import { NAV_GROUPS } from '@/components/admin/nav-items'
import { MasLogout } from '@/components/admin/mas-logout'
import { Page, PageHeader } from '@/components/admin/ui'

// Pestaña "Más" del celular: todo lo que no entra en la barra de abajo. En compu el menú lateral
// ya muestra estas secciones, pero la página funciona igual si alguien entra directo.
export default async function MasPage() {
  const [ctx, user] = await Promise.all([getAdminOrgWithStatus(), getAuthUser()])
  if (!ctx) notFound()

  const supabase = await createClient()
  const [{ count: categorias }, { count: tamanos }] = await Promise.all([
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('sizes').select('id', { count: 'exact', head: true }),
  ])

  const detalle: Record<string, string> = {
    '/admin/categorias': `${categorias ?? 0} ${categorias === 1 ? 'categoría' : 'categorías'}`,
    '/admin/tamanos': `${tamanos ?? 0} ${tamanos === 1 ? 'tamaño' : 'tamaños'}`,
    '/admin/hero': 'Imágenes de portada',
    '/admin/personalizacion': 'Logo, colores, textos y redes',
    '/admin/configuracion': 'Mercado Pago, transferencia y envíos',
  }
  const online = !soloLectura(ctx)
  const name = ctx.storeName ?? ctx.organizationName

  return (
    <Page width={720}>
      <PageHeader title="Más" />
      <div className="adm-card flex items-center gap-3 p-3.5">
        <StoreLogo name={name} logoUrl={ctx.logoUrl} size={44} />
        <div className="min-w-0 flex-1">
          <b className="block truncate">{name}</b>
          <span className="block truncate text-[13px]" style={{ color: 'var(--adm-muted)' }}>
            {user?.email}
          </span>
        </div>
        <span className={`adm-badge ${online ? 'adm-b-ok' : 'adm-b-bad'}`}>{online ? 'Online' : 'Suspendida'}</span>
      </div>

      {NAV_GROUPS.map((g) => (
        <div key={g.title}>
          <div className="mx-1 mb-2 mt-5 text-[12px] uppercase tracking-[0.06em]" style={{ color: 'var(--adm-soft)' }}>
            {g.title}
          </div>
          <div className="adm-card overflow-hidden">
            {g.items.map((item) => (
              <MenuRow key={item.href} href={item.href} icon={<item.icon />} title={item.label} detail={detalle[item.href]} />
            ))}
          </div>
        </div>
      ))}

      <div className="mx-1 mb-2 mt-5 text-[12px] uppercase tracking-[0.06em]" style={{ color: 'var(--adm-soft)' }}>
        Cuenta
      </div>
      <div className="adm-card overflow-hidden">
        {ctx.plan === 'tienda' && (
          <MenuRow href="/admin/suscripcion" icon={<CreditCard />} title="Mi suscripción" detail="Plan, cobros y soporte" />
        )}
        <MasLogout />
      </div>
    </Page>
  )
}

function MenuRow({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3.5 py-3 [&:not(:last-child)]:border-b"
      style={{ borderColor: 'var(--adm-line2)' }}
    >
      <span className="grid h-9 w-9 place-items-center rounded-[10px] [&>svg]:h-[18px] [&>svg]:w-[18px]" style={{ backgroundColor: 'var(--adm-bg)' }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block font-medium">{title}</b>
        {detail && (
          <span className="block truncate text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
            {detail}
          </span>
        )}
      </span>
      <ChevronRight className="h-[18px] w-[18px]" style={{ color: 'var(--adm-soft)' }} />
    </Link>
  )
}
