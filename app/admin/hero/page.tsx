import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HeroManager } from '@/components/admin/hero-manager'

export default async function HeroPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hero_images')
    .select('*')
    .order('position')

  return (
    <div className="mx-auto max-w-[800px] px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
          ← Volver
        </Link>
        <h1 className="mt-4 text-[24px] font-medium" style={{ color: '#111111' }}>
          Banner de inicio
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: '#6b6b6b' }}>
          Estas imágenes aparecen de fondo en la pantalla principal de la tienda.
        </p>
      </div>

      <HeroManager images={data ?? []} />
    </div>
  )
}
