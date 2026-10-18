import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { PedidosList } from '@/components/admin/pedidos-list'
import { Page } from '@/components/admin/ui'

export default async function PedidosPage({
  searchParams,
}: {
  // id: pedido abierto (desde Inicio). q: búsqueda de la barra de arriba. filtro=atender: atajo.
  searchParams: Promise<{ id?: string; q?: string; filtro?: string }>
}) {
  const ctx = await getOrgForAdminRead()
  if (!ctx) notFound()

  const { id, q, filtro } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_orders')
    .select('*, store_order_items(*)')
    .order('created_at', { ascending: false })
    .limit(300)

  return (
    <Page>
      <PedidosList
        key={`${id ?? ''}|${q ?? ''}|${filtro ?? ''}`}
        orders={data ?? []}
        initialId={id}
        initialSearch={q ?? ''}
        initialFilter={filtro === 'atender' ? 'atender' : id || q ? 'todos' : undefined}
      />
    </Page>
  )
}
