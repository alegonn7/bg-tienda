import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ManageList } from '@/components/admin/manage-list'
import { createCategory, deleteCategory } from '@/app/admin/actions'

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const categories = data ?? []

  return (
    <div className="mx-auto max-w-[700px] px-8 py-10">
      <div className="mb-8">
        <Link href="/admin" className="text-[13px]" style={{ color: '#6b6b6b' }}>
          ← Volver
        </Link>
        <h1 className="mt-4 text-[24px] font-medium" style={{ color: '#111111' }}>
          Categorías
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: '#6b6b6b' }}>
          Estas categorías aparecen como filtros en la tienda y al crear productos.
        </p>
      </div>

      <ManageList
        items={categories}
        onAdd={createCategory}
        onDelete={deleteCategory}
        placeholder="Ej: Chapita, Llavero, Prendedor..."
      />
    </div>
  )
}
