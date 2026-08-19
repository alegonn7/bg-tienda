import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ManageList } from '@/components/admin/manage-list'
import { createSize, deleteSize } from '@/app/admin/actions'

export default async function TamanosPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('sizes').select('*').order('name')

  const sizes = data ?? []

  return (
    <div className="mx-auto max-w-[700px] px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
          ← Volver
        </Link>
        <h1 className="mt-4 text-[24px] font-medium" style={{ color: '#111111' }}>
          Tamaños
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: '#6b6b6b' }}>
          Estos tamaños aparecen como filtro en la tienda y para elegir al cargar un producto.
        </p>
      </div>

      <ManageList
        items={sizes}
        onAdd={createSize}
        onDelete={deleteSize}
        placeholder="Ej: 25mm, 38mm, 50mm..."
      />
    </div>
  )
}
