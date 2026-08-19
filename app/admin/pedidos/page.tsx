import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { PedidosList } from '@/components/admin/pedidos-list'

export default async function PedidosPage() {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) notFound()

  const supabase = await createClient()
  const { data } = await supabase
    .from('store_orders')
    .select('*, store_order_items(*)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="mx-auto max-w-[900px] px-8 py-10">
      <div className="mb-8">
        <h1 className="text-[24px] font-medium" style={{ color: '#111111' }}>
          Pedidos
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: '#6b6b6b' }}>
          Pedidos hechos desde la tienda online. Confirmar descuenta el stock de verdad.
        </p>
      </div>

      <PedidosList orders={data ?? []} />
    </div>
  )
}
