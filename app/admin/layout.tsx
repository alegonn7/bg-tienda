import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { LogoutButton } from '@/components/admin/logout-button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // proxy.ts ya debería haber redirigido a /admin/login antes de llegar acá — esto es defensa
    // adicional, no el mecanismo principal.
    return <main>{children}</main>
  }

  const ctx = await getCurrentOrgForAdmin()

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
          {ctx && (
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
            </nav>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[13px] break-all" style={{ color: '#6b6b6b' }}>
            {user.email}
          </span>
          {ctx && (
            <Link href={`/${ctx.organizationSlug}`} className="text-[13px]" style={{ color: '#6b6b6b' }}>
              Ver tienda →
            </Link>
          )}
          <LogoutButton />
        </div>
      </header>
      <main>
        {ctx ? (
          children
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
