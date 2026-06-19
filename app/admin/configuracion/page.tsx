import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FaviconManager } from '@/components/admin/favicon-manager'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'favicon')
    .single()

  return (
    <div className="mx-auto max-w-[700px] px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
          ← Volver
        </Link>
        <h1 className="mt-4 text-[24px] font-medium" style={{ color: '#111111' }}>
          Configuración
        </h1>
      </div>

      <div className="p-8" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h2 className="mb-1 text-[15px] font-medium" style={{ color: '#111111' }}>
          Favicon
        </h2>
        <p className="mb-6 text-[13px]" style={{ color: '#6b6b6b' }}>
          El ícono que aparece en la pestaña del navegador.
        </p>
        <FaviconManager current={data?.value ?? null} />
      </div>
    </div>
  )
}
