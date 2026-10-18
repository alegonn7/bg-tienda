import Link from 'next/link'
import {
  Eye,
  ImagePlus,
  Landmark,
  Package,
  PackageX,
  Plus,
  Receipt,
  ShoppingBag,
  TriangleAlert,
  Truck,
  Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAdminProducts } from '@/lib/products-server'
import { getOrgForAdminRead, soloLectura } from '@/lib/tenant'
import { orderState, PAYMENT_LABEL } from '@/lib/orders'
import { arDateKey, arMonthStart, formatPrice, timeAgo } from '@/lib/format'
import { SITE_URL } from '@/lib/site-config'
import { Avatar, Page, PageHeader } from '@/components/admin/ui'
import { ShareStore } from '@/components/admin/share-store'

type DashOrder = {
  id: string
  order_number: number
  status: string
  total: number | null
  created_at: string
  payment_method: string
  mp_status: string | null
  delivery_method: string | null
  tracking_code: string | null
  customer_name: string | null
  shipping_city: string | null
  shipping_province: string | null
  store_order_items: { quantity: number }[]
}

const TONE_CLASS = { ok: 'adm-b-ok', warn: 'adm-b-warn', bad: 'adm-b-bad', info: 'adm-b-info', gray: 'adm-b-gray' }

// Inicio: lo que pasa hoy en la tienda y lo que espera una acción del dueño.
export default async function InicioPage() {
  const ctx = await getOrgForAdminRead()
  if (!ctx) return null // app/admin/layout.tsx ya no renderiza children en este caso

  const now = new Date()
  const monthStart = arMonthStart(now)
  const prevMonthStart = arMonthStart(now, -1)

  const supabase = await createClient()
  const [products, { data: ordersData }] = await Promise.all([
    getAdminProducts(ctx.onlineBranchId),
    supabase
      .from('store_orders')
      .select(
        'id, order_number, status, total, created_at, payment_method, mp_status, delivery_method, tracking_code, customer_name, shipping_city, shipping_province, store_order_items(quantity)',
      )
      .gte('created_at', prevMonthStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(2000),
  ])
  const orders = (ordersData ?? []) as DashOrder[]

  // Ventas = pedidos confirmados (pagados). Los pendientes y cancelados no cuentan.
  const thisMonth = orders.filter((o) => new Date(o.created_at) >= monthStart)
  const prevMonth = orders.filter((o) => new Date(o.created_at) < monthStart)
  const paidThis = thisMonth.filter((o) => o.status === 'confirmed')
  const paidPrev = prevMonth.filter((o) => o.status === 'confirmed')
  const sum = (list: DashOrder[]) => list.reduce((acc, o) => acc + (o.total ?? 0), 0)
  const salesThis = sum(paidThis)
  const salesPrev = sum(paidPrev)
  const ticket = paidThis.length ? salesThis / paidThis.length : 0
  const ticketPrev = paidPrev.length ? salesPrev / paidPrev.length : 0
  const ordersThis = thisMonth.filter((o) => o.status !== 'cancelled').length

  // Lo que espera una acción. Los pedidos pendientes pueden ser de antes del mes pasado, pero
  // con 2000 filas de dos meses alcanza de sobra para una tienda chica; el contador del menú
  // (que no tiene ese límite) es la fuente de verdad si algo quedara afuera.
  const toConfirm = orders.filter((o) => o.status === 'pending' && o.payment_method !== 'mercadopago')
  const stuckPaid = orders.filter((o) => o.status === 'pending' && o.payment_method === 'mercadopago' && o.mp_status === 'approved')
  const toShip = orders.filter((o) => o.status === 'confirmed' && o.delivery_method === 'shipping' && !o.tracking_code)
  const inStore = products.filter((p) => p.branchActive !== false)
  const outOfStock = inStore.filter((p) => p.active && p.stock === 0)
  const noImage = inStore.filter((p) => p.images.length === 0)
  const visible = inStore.filter((p) => p.active && (p.stock ?? 0) > 0)

  // Ventas de los últimos 14 días, por día de Argentina.
  const days: { key: string; label: string; total: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = arDateKey(d)
    days.push({ key, label: String(Number(key.slice(8, 10))), total: 0 })
  }
  for (const o of orders) {
    if (o.status !== 'confirmed') continue
    const day = days.find((d) => d.key === arDateKey(o.created_at))
    if (day) day.total += o.total ?? 0
  }
  const maxDay = Math.max(...days.map((d) => d.total), 1)
  const lastSales14 = days.reduce((a, d) => a + d.total, 0)

  const todos = [
    toConfirm.length > 0 && {
      key: 'confirm',
      href: '/admin/pedidos?filtro=atender',
      icon: <Landmark />,
      tone: 'warn',
      title: `${toConfirm.length} ${toConfirm.length === 1 ? 'pago para confirmar' : 'pagos para confirmar'}`,
      detail: `${toConfirm
        .slice(0, 3)
        .map((o) => `#${o.order_number}`)
        .join(', ')}${toConfirm.length > 3 ? '…' : ''} · transferencia o WhatsApp`,
      cta: 'Revisar',
    },
    stuckPaid.length > 0 && {
      key: 'stuck',
      href: '/admin/pedidos?filtro=atender',
      icon: <TriangleAlert />,
      tone: 'bad',
      title: `${stuckPaid.length} ${stuckPaid.length === 1 ? 'pedido pagado' : 'pedidos pagados'} sin stock`,
      detail: 'Mercado Pago cobró pero no había stock. Revisalo o reembolsá.',
      cta: 'Revisar',
    },
    toShip.length > 0 && {
      key: 'ship',
      href: '/admin/pedidos?filtro=atender',
      icon: <Truck />,
      tone: 'info',
      title: `${toShip.length} ${toShip.length === 1 ? 'pedido para despachar' : 'pedidos para despachar'}`,
      detail: toShip
        .slice(0, 2)
        .map((o) => `#${o.order_number}${o.shipping_city ? ` · ${o.shipping_city}` : ''}`)
        .join(', '),
      cta: 'Ver pedidos',
    },
    outOfStock.length > 0 && {
      key: 'stock',
      href: '/admin/productos?filtro=sin-stock',
      icon: <PackageX />,
      tone: 'bad',
      title: `${outOfStock.length} ${outOfStock.length === 1 ? 'producto sin stock' : 'productos sin stock'}`,
      detail: 'No se muestran en la tienda hasta que repongas',
      cta: 'Ver lista',
    },
    noImage.length > 0 && {
      key: 'img',
      href: '/admin/productos/sugerir-imagenes',
      icon: <ImagePlus />,
      tone: 'accent',
      title: `${noImage.length} ${noImage.length === 1 ? 'producto sin foto' : 'productos sin foto'}`,
      detail: 'Te sugerimos imágenes automáticamente',
      cta: 'Sugerir fotos',
    },
  ].filter(Boolean) as { key: string; href: string; icon: React.ReactNode; tone: string; title: string; detail: string; cta: string }[]

  const toneStyle: Record<string, React.CSSProperties> = {
    warn: { backgroundColor: 'var(--adm-warn-soft)', color: 'var(--adm-warn)' },
    bad: { backgroundColor: 'var(--adm-bad-soft)', color: 'var(--adm-bad)' },
    info: { backgroundColor: 'var(--adm-info-soft)', color: 'var(--adm-info)' },
    accent: { backgroundColor: 'var(--adm-accent-soft)', color: 'var(--adm-accent)' },
  }

  const storeUrl = `${SITE_URL}/${ctx.organizationSlug}`
  const online = !soloLectura(ctx)
  const recent = orders.slice(0, 5)
  const monthName = prevMonthStart.toLocaleDateString('es-AR', { month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })

  return (
    <Page>
      <PageHeader
        title="Hola 👋"
        description={`Esto es lo que pasa hoy en ${ctx.storeName ?? ctx.organizationName}.`}
        actions={
          <Link href="/admin/productos/nuevo" className="adm-btn adm-btn-pri hidden md:inline-flex">
            <Plus />
            Nuevo producto
          </Link>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 md:mb-[18px] md:grid-cols-4 md:gap-3.5">
        <Kpi icon={<Wallet />} label="Ventas del mes" value={formatPrice(salesThis)} delta={compare(salesThis, salesPrev, monthName)} />
        <Kpi
          icon={<ShoppingBag />}
          label="Pedidos del mes"
          value={String(ordersThis)}
          note={todos.length ? `${toConfirm.length + toShip.length + stuckPaid.length} esperan acción` : 'Nada pendiente'}
        />
        <Kpi icon={<Receipt />} label="Ticket promedio" value={formatPrice(Math.round(ticket))} delta={compare(ticket, ticketPrev, monthName)} />
        <Kpi
          icon={<Eye />}
          label="Productos visibles"
          value={
            <>
              {visible.length}
              <span className="text-[15px] font-medium" style={{ color: 'var(--adm-soft)' }}>
                {' '}
                / {products.length}
              </span>
            </>
          }
          note={products.length - visible.length > 0 ? `${products.length - visible.length} no se ven` : 'Todos se ven'}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3 md:gap-4">
          <div className="adm-card">
            <div className="adm-card-h">
              <h3>Para hacer</h3>
              {todos.length > 0 ? (
                <span className="adm-badge adm-b-bad">
                  {todos.length} {todos.length === 1 ? 'pendiente' : 'pendientes'}
                </span>
              ) : (
                <span className="adm-badge adm-b-ok">Todo al día</span>
              )}
            </div>
            {todos.length === 0 ? (
              <p className="px-[18px] py-6 adm-hint">No hay nada esperando. Cuando entre un pedido o falte stock, te avisamos acá.</p>
            ) : (
              todos.map((t) => (
                <Link
                  key={t.key}
                  href={t.href}
                  className="flex items-center gap-3 px-3.5 py-3 md:px-[18px] [&:not(:last-child)]:border-b"
                  style={{ borderColor: 'var(--adm-line2)' }}
                >
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[10px] [&>svg]:h-[18px] [&>svg]:w-[18px]" style={toneStyle[t.tone]}>
                    {t.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-medium">{t.title}</b>
                    <span className="block text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
                      {t.detail}
                    </span>
                  </span>
                  <span className="adm-btn adm-btn-sm hidden md:inline-flex">{t.cta}</span>
                  <span className="text-[22px] md:hidden" style={{ color: 'var(--adm-soft)' }}>
                    ›
                  </span>
                </Link>
              ))
            )}
          </div>

          <div className="adm-card hidden md:block">
            <div className="adm-card-h">
              <h3>Ventas · últimos 14 días</h3>
              <span className="text-[13px]" style={{ color: 'var(--adm-muted)' }}>
                {formatPrice(lastSales14)}
              </span>
            </div>
            <div className="flex h-[150px] items-end gap-2.5 px-[18px] pb-1.5 pt-[18px]">
              {days.map((d, i) => (
                <div
                  key={d.key}
                  title={`${d.label}: ${formatPrice(d.total)}`}
                  className="flex-1 rounded-t-md rounded-b-sm"
                  style={{
                    height: `${Math.max(4, (d.total / maxDay) * 100)}%`,
                    backgroundColor: i === days.length - 1 ? 'var(--adm-accent)' : d.total > 0 ? 'var(--adm-ink)' : '#ececea',
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2.5 px-[18px] pb-4 text-[11.5px]" style={{ color: 'var(--adm-soft)' }}>
              {days.map((d) => (
                <span key={d.key} className="flex-1 text-center">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 md:gap-4">
          <div className="adm-card">
            <div className="adm-card-h">
              <h3>Últimos pedidos</h3>
              <Link href="/admin/pedidos" className="text-[13px]" style={{ color: 'var(--adm-muted)' }}>
                Ver todos →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="px-[18px] py-6 adm-hint">Todavía no entró ningún pedido. Compartí tu tienda para empezar a vender.</p>
            ) : (
              recent.map((o) => {
                const st = orderState(o)
                const items = o.store_order_items.reduce((a, i) => a + i.quantity, 0)
                return (
                  <Link
                    key={o.id}
                    href={`/admin/pedidos?id=${o.id}`}
                    className="flex items-center gap-3 px-3.5 py-3 md:px-[18px] [&:not(:last-child)]:border-b"
                    style={{ borderColor: 'var(--adm-line2)' }}
                  >
                    <Avatar name={o.customer_name} />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate font-medium">
                        #{o.order_number}
                        {o.customer_name ? ` · ${o.customer_name}` : ''}
                      </b>
                      <span className="block truncate text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
                        {items} {items === 1 ? 'producto' : 'productos'} · {PAYMENT_LABEL[o.payment_method] ?? o.payment_method} ·{' '}
                        {timeAgo(o.created_at)}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-0.5">
                      <b>{formatPrice(o.total)}</b>
                      <span className={`adm-badge ${TONE_CLASS[st.tone]}`}>{st.label}</span>
                    </span>
                  </Link>
                )
              })
            )}
          </div>

          <div className="adm-card">
            <div className="adm-card-h">
              <h3>Tu tienda</h3>
              <span className={`adm-badge ${online ? 'adm-b-ok' : 'adm-b-bad'}`}>{online ? 'Online' : 'Suspendida'}</span>
            </div>
            <ShareStore url={storeUrl} storeName={ctx.storeName ?? ctx.organizationName} />
          </div>

          {products.length === 0 && (
            <Link href="/admin/productos/nuevo" className="adm-card flex items-center gap-3 p-4">
              <span className="grid h-9 w-9 place-items-center rounded-[10px]" style={{ backgroundColor: 'var(--adm-bg)' }}>
                <Package className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1">
                <b className="block font-medium">Cargá tu primer producto</b>
                <span className="text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
                  Con foto, precio y stock ya aparece en la tienda.
                </span>
              </span>
            </Link>
          )}
        </div>
      </div>

      <Link
        href="/admin/productos/nuevo"
        className="fixed bottom-[84px] right-4 z-30 grid h-[54px] w-[54px] place-items-center rounded-2xl text-white shadow-lg md:hidden"
        style={{ backgroundColor: 'var(--adm-ink)' }}
        aria-label="Nuevo producto"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </Page>
  )
}

function compare(current: number, previous: number, prevLabel: string): { text: string; up: boolean } | undefined {
  if (!previous) return undefined
  const pct = Math.round(((current - previous) / previous) * 100)
  return { text: `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs. ${prevLabel}`, up: pct >= 0 }
}

function Kpi({
  icon,
  label,
  value,
  delta,
  note,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  delta?: { text: string; up: boolean }
  note?: string
}) {
  return (
    <div className="adm-card px-3.5 py-3 md:px-[18px] md:py-4">
      <div className="flex items-center gap-2 text-[12.5px] md:text-[13px] [&>svg]:h-4 [&>svg]:w-4" style={{ color: 'var(--adm-muted)' }}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 truncate text-[20px] font-semibold tracking-[-0.01em] md:mt-2 md:text-[26px]">{value}</div>
      {delta ? (
        <div className="truncate text-[12px] md:text-[12.5px]" style={{ color: delta.up ? 'var(--adm-ok)' : 'var(--adm-bad)' }}>
          {delta.text}
        </div>
      ) : (
        <div className="truncate text-[12px] md:text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
          {note ?? ' '}
        </div>
      )}
    </div>
  )
}
