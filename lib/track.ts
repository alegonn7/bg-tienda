// Estadísticas de la tienda (visitas, productos vistos, agregados al carrito) que el dueño ve en
// /admin/estadisticas. Solo navegador. Cada navegador tiene un id al azar en localStorage, sin
// datos personales; la función track_store_event (Supabase) valida tienda y producto.
//
// fetch directo a la RPC (y no el cliente de Supabase) para no sumarle peso a la tienda, con
// keepalive para que el evento salga aunque el visitante cambie de página enseguida. Las recargas
// no cuentan doble: la función ignora la misma página o producto del mismo navegador por 30 minutos.

type StoreEvent = 'page_view' | 'product_view' | 'add_to_cart'

const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|facebookexternalhit|whatsapp/i

let memoryVisitorId: string | null = null

function visitorId(): string {
  try {
    let id = localStorage.getItem('bg_vid')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('bg_vid', id)
    }
    return id
  } catch {
    // Navegación privada o almacenamiento bloqueado: un id por pestaña.
    memoryVisitorId ??= crypto.randomUUID()
    return memoryVisitorId
  }
}

export function trackStoreEvent(
  organizationId: string,
  event: StoreEvent,
  { productId, quantity, path }: { productId?: string; quantity?: number; path?: string } = {},
) {
  if (typeof window === 'undefined' || navigator.webdriver || BOT.test(navigator.userAgent)) return
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return
  fetch(`${url}/rest/v1/rpc/track_store_event`, {
    method: 'POST',
    keepalive: true,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_organization_id: organizationId,
      p_event_type: event,
      p_visitor_id: visitorId(),
      p_product_id: productId ?? null,
      p_quantity: quantity ?? null,
      p_path: path ?? null,
    }),
  }).catch(() => {
    // Una estadística perdida no tiene que molestar al que compra.
  })
}
