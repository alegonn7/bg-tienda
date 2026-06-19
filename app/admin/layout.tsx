import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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

  return (
    <div style={{ backgroundColor: '#fafaf9', minHeight: '100vh' }}>
      {user && (
        <header
          className="flex items-center justify-between px-8 py-4"
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <div className="flex items-center gap-8">
            <span className="text-[15px] font-medium" style={{ color: '#111111' }}>
              PinsCrew Admin
            </span>
            <nav className="flex gap-6">
              <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Productos
              </Link>
              <Link href="/admin/categorias" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Categorías
              </Link>
              <Link href="/admin/medidas" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Medidas
              </Link>
              <Link href="/admin/hero" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Banner
              </Link>
              <Link href="/admin/configuracion" className="text-[13px]" style={{ color: '#6b6b6b' }}>
                Configuración
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px]" style={{ color: '#6b6b6b' }}>
              {user.email}
            </span>
            <Link
              href="/"
              className="text-[13px]"
              style={{ color: '#6b6b6b' }}
            >
              Ver tienda →
            </Link>
            <LogoutButton />
          </div>
        </header>
      )}
      <main>{children}</main>
    </div>
  )
}
