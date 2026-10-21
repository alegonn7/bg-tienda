import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Eye, MousePointerClick, ShoppingBag, ShoppingCart, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOrgForAdminRead } from '@/lib/tenant'
import { Page, PageHeader } from '@/components/admin/ui'

type Stats = {
  days: number
  visitors: number
  page_views: number
  cart_visitors: number
  cart_units: number
  orders: number
  daily: { day: string; visitors: number; page_views: number }[]
  top_cart: { product_id: string; name: string; units: number; visitors: number }[]
  top_viewed: { product_id: string; name: string; views: number; visitors: number }[]
}

const PERIODS = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
]

// Estadísticas de la tienda: cuánta gente entró y qué productos miran y agregan al carrito.
// Los datos los junta lib/track.ts en la tienda pública y los resume la función store_stats.
export default async function EstadisticasPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const ctx = await getOrgForAdminRead()
  if (!ctx) notFound()

  const { dias } = await searchParams
  const days = PERIODS.find((p) => String(p.days) === dias)?.days ?? 30

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('store_stats', { p_days: days })
  const stats = data as Stats | null

  return (
    <Page>
      <PageHeader
        title="Estadísticas"
        description="Cuánta gente visita tu tienda y qué productos les interesan."
        actions={
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <Link key={p.days} href={`/admin/estadisticas?dias=${p.days}`} className="adm-chip" data-on={p.days === days}>
                {p.label}
              </Link>
            ))}
          </div>
        }
      />

      {error || !stats ? (
        <div className="adm-card px-[18px] py-6 adm-hint">No se pudieron cargar las estadísticas. Probá de nuevo en un rato.</div>
      ) : (
        <StatsView stats={stats} />
      )}
    </Page>
  )
}

function StatsView({ stats }: { stats: Stats }) {
  const conversion = stats.visitors ? (stats.orders / stats.visitors) * 100 : 0
  const maxDay = Math.max(...stats.daily.map((d) => d.visitors), 1)
  // Con 90 barras no entran todas las fechas: se muestra una de cada tantas.
  const labelEvery = stats.daily.length > 31 ? 15 : stats.daily.length > 7 ? 5 : 1

  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-2.5 md:mb-[18px] md:grid-cols-4 md:gap-3.5">
        <Kpi icon={<Users />} label="Visitantes" value={stats.visitors} note={`${stats.page_views} páginas vistas`} />
        <Kpi
          icon={<ShoppingCart />}
          label="Agregaron al carrito"
          value={stats.cart_visitors}
          note={`${stats.cart_units} ${stats.cart_units === 1 ? 'unidad' : 'unidades'} en total`}
        />
        <Kpi icon={<ShoppingBag />} label="Pedidos" value={stats.orders} note="Sin contar cancelados" />
        <Kpi
          icon={<MousePointerClick />}
          label="Conversión"
          value={`${conversion.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`}
          note="Pedidos cada 100 visitantes"
        />
      </div>

      <div className="adm-card mb-3 md:mb-4">
        <div className="adm-card-h">
          <h3>Visitantes por día</h3>
          <span className="text-[13px]" style={{ color: 'var(--adm-muted)' }}>
            Últimos {stats.days} días
          </span>
        </div>
        <div className="flex h-[150px] items-end gap-[3px] px-3.5 pb-1.5 pt-[18px] md:gap-1.5 md:px-[18px]">
          {stats.daily.map((d, i) => (
            <div
              key={d.day}
              title={`${formatDay(d.day)}: ${d.visitors} ${d.visitors === 1 ? 'visitante' : 'visitantes'}`}
              className="flex-1 rounded-t-md rounded-b-sm"
              style={{
                height: `${Math.max((d.visitors / maxDay) * 100, d.visitors > 0 ? 4 : 2)}%`,
                backgroundColor: i === stats.daily.length - 1 ? 'var(--adm-accent)' : d.visitors > 0 ? 'var(--adm-ink)' : '#ececea',
              }}
            />
          ))}
        </div>
        <div className="flex gap-[3px] px-3.5 pb-4 text-[11px] md:gap-1.5 md:px-[18px]" style={{ color: 'var(--adm-soft)' }}>
          {stats.daily.map((d, i) => (
            <span key={d.day} className="flex-1 overflow-visible whitespace-nowrap text-center">
              {(stats.daily.length - 1 - i) % labelEvery === 0 ? Number(d.day.slice(8, 10)) : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
        <Ranking
          title="Más agregados al carrito"
          empty="Todavía nadie agregó productos al carrito en este período."
          rows={stats.top_cart.map((p) => ({
            id: p.product_id,
            name: p.name,
            value: `${p.units} ${p.units === 1 ? 'unidad' : 'unidades'}`,
            detail: `${p.visitors} ${p.visitors === 1 ? 'persona' : 'personas'}`,
            amount: p.units,
          }))}
        />
        <Ranking
          title="Más vistos"
          empty="Todavía nadie abrió un producto en este período."
          rows={stats.top_viewed.map((p) => ({
            id: p.product_id,
            name: p.name,
            value: `${p.views} ${p.views === 1 ? 'vista' : 'vistas'}`,
            detail: `${p.visitors} ${p.visitors === 1 ? 'persona' : 'personas'}`,
            amount: p.views,
          }))}
        />
      </div>

      <p className="mt-4 adm-hint">
        <Eye className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
        Cada navegador cuenta como un visitante. No se guarda ningún dato personal de quien visita.
      </p>
    </>
  )
}

function Ranking({
  title,
  empty,
  rows,
}: {
  title: string
  empty: string
  rows: { id: string; name: string; value: string; detail: string; amount: number }[]
}) {
  const max = Math.max(...rows.map((r) => r.amount), 1)
  return (
    <div className="adm-card min-w-0">
      <div className="adm-card-h">
        <h3>{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-[18px] py-6 adm-hint">{empty}</p>
      ) : (
        rows.map((r, i) => (
          <Link
            key={r.id}
            href={`/admin/productos/${r.id}/editar`}
            className="flex items-center gap-3 px-3.5 py-3 md:px-[18px] [&:not(:last-child)]:border-b"
            style={{ borderColor: 'var(--adm-line2)' }}
          >
            <span className="w-5 flex-shrink-0 text-[13px] font-semibold" style={{ color: 'var(--adm-soft)' }}>
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate font-medium">{r.name}</b>
              <span className="mt-1 block h-1.5 rounded-full" style={{ backgroundColor: 'var(--adm-line2)' }}>
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(r.amount / max) * 100}%`, backgroundColor: 'var(--adm-accent)' }}
                />
              </span>
            </span>
            <span className="flex-shrink-0 text-right">
              <b className="block text-[14px] font-semibold">{r.value}</b>
              <span className="block text-[12px]" style={{ color: 'var(--adm-muted)' }}>
                {r.detail}
              </span>
            </span>
          </Link>
        ))
      )}
    </div>
  )
}

function Kpi({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: React.ReactNode; note: string }) {
  return (
    <div className="adm-card px-3.5 py-3 md:px-[18px] md:py-4">
      <div className="flex items-center gap-2 text-[12.5px] md:text-[13px] [&>svg]:h-4 [&>svg]:w-4" style={{ color: 'var(--adm-muted)' }}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 truncate text-[20px] font-semibold tracking-[-0.01em] md:mt-2 md:text-[26px]">{value}</div>
      <div className="truncate text-[12px] md:text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
        {note}
      </div>
    </div>
  )
}

function formatDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
