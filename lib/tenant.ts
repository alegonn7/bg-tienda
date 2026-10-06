import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'

export type Store = {
  organizationId: string
  organizationName: string
  slug: string
  branchId: string
  storeName: string | null
  logoUrl: string | null
  logoHeight: number
  headerDisplay: 'logo' | 'name' | 'both'
  faviconUrl: string | null
  accentColor: string | null
  whatsappNumber: string | null
  whatsappMessageTemplate: string | null
  whatsappOrdersEnabled: boolean
  instagramUrl: string | null
  facebookUrl: string | null
  showPrices: boolean
  paymentOnlineEnabled: boolean
  mercadopagoAvailable: boolean
  shippingEnabled: boolean
  shippingCarrier: string | null
  transferEnabled: boolean
  transferCbu: string | null
  transferAlias: string | null
  transferReceiptEmail: string | null
  heroTitle: string | null
  heroSubtitle: string | null
  features: { title: string; text: string; icon?: string }[]
}

// Resuelve slug -> tienda pública. Usa la vista store_directory (Fase 01), que ya filtra por
// enabled=true y solo expone columnas seguras para un visitante sin sesión.
export const getStoreBySlug = cache(async (slug: string): Promise<Store | null> => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('store_directory')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  // Un error de red/Supabase NO es "la tienda no existe": se lanza para que la página cacheada
  // (ISR) no quede guardada como 404 — Next sigue sirviendo la última versión buena.
  if (error) throw new Error(`getStoreBySlug(${slug}): ${error.message}`)
  if (!data) return null

  return {
    organizationId: data.organization_id,
    organizationName: data.organization_name,
    slug: data.slug,
    branchId: data.branch_id,
    storeName: data.store_name,
    logoUrl: data.logo_url,
    logoHeight: data.logo_height ?? 32,
    headerDisplay: (data.header_display as Store['headerDisplay']) ?? 'logo',
    faviconUrl: data.favicon_url,
    accentColor: data.accent_color,
    whatsappNumber: data.whatsapp_number,
    whatsappMessageTemplate: data.whatsapp_message_template,
    whatsappOrdersEnabled: data.whatsapp_orders_enabled ?? true,
    instagramUrl: data.instagram_url,
    facebookUrl: data.facebook_url,
    showPrices: data.show_prices,
    paymentOnlineEnabled: data.payment_online_enabled,
    mercadopagoAvailable: data.mercadopago_available ?? false,
    shippingEnabled: data.shipping_enabled ?? false,
    shippingCarrier: data.shipping_carrier ?? null,
    transferEnabled: data.transfer_enabled ?? false,
    transferCbu: data.transfer_cbu ?? null,
    transferAlias: data.transfer_alias ?? null,
    transferReceiptEmail: data.transfer_receipt_email ?? null,
    heroTitle: data.hero_title,
    heroSubtitle: data.hero_subtitle,
    features: Array.isArray(data.features) ? data.features : [],
  }
})

export type AdminOrgContext = {
  userId: string
  organizationId: string
  organizationSlug: string
  organizationName: string
  storeName: string | null
  role: string
  onlineBranchId: string
  storeSettingsId: string
  logoUrl: string | null
  faviconUrl: string | null
  plan: string
  // pending (alta automática sin pago confirmado) / trial / active / past_due / suspended
  subscriptionStatus: string | null
}

// Estados en los que el panel no deja operar: la cuenta todavía no pagó, o dejó de pagar.
const ESTADOS_BLOQUEADOS = ['pending', 'suspended']

export function adminBloqueado(ctx: AdminOrgContext): boolean {
  return ESTADOS_BLOQUEADOS.includes(ctx.subscriptionStatus ?? '')
}

// Usuario logueado, una sola vez por request (layout, page y server actions comparten el
// resultado vía cache()). getClaims() valida la firma del JWT localmente cuando el proyecto
// usa signing keys asimétricas — sin ir al servidor de Auth en cada navegación del admin — y
// si no, cae a getUser() igual que antes.
export const getAuthUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null }
})

// Resuelve la organización del usuario logueado a partir de su sesión (nunca de la URL — ver
// Fase 04), sin importar el estado de su suscripción. Solo para el layout del admin, que necesita
// saber si mostrar la pantalla de cuenta suspendida; todo lo demás usa getCurrentOrgForAdmin.
export const getAdminOrgWithStatus = cache(async (): Promise<AdminOrgContext | null> => {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: userRow } = await supabase
    .from('users')
    .select('id, organization_id, role, organizations(slug, name, logo_url, plan, subscription_status)')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!userRow) return null

  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('id, branch_id, enabled, store_name, favicon_url')
    .eq('organization_id', userRow.organization_id)
    .maybeSingle()

  if (!storeSettings || !storeSettings.enabled) return null

  const org = userRow.organizations as unknown as {
    slug: string
    name: string
    logo_url: string | null
    plan: string
    subscription_status: string | null
  } | null

  return {
    userId: userRow.id,
    organizationId: userRow.organization_id,
    organizationSlug: org?.slug ?? '',
    organizationName: org?.name ?? '',
    storeName: storeSettings.store_name,
    role: userRow.role,
    onlineBranchId: storeSettings.branch_id,
    storeSettingsId: storeSettings.id,
    logoUrl: org?.logo_url ?? null,
    faviconUrl: storeSettings.favicon_url,
    plan: org?.plan ?? '',
    subscriptionStatus: org?.subscription_status ?? null,
  }
})

// Organización del usuario logueado para operar el panel (páginas y server actions). Devuelve
// null si no hay sesión, si el usuario no pertenece a ninguna organización, si su organización no
// tiene bg-tienda habilitada, o si la cuenta no pagó (pending) o está suspendida — en cualquiera
// de esos casos /admin debe mostrar un estado claro en vez de intentar operar.
export const getCurrentOrgForAdmin = cache(async (): Promise<AdminOrgContext | null> => {
  const ctx = await getAdminOrgWithStatus()
  if (!ctx || adminBloqueado(ctx)) return null
  return ctx
})

// Organización para LEER el panel: incluye las cuentas suspendidas, que entran en modo lectura
// (ven sus productos, pedidos y configuración, pero no pueden cambiar nada hasta reactivar). Las
// pending (todavía no pagaron) no: para ellas el layout solo muestra el estado del pago.
export const getOrgForAdminRead = cache(async (): Promise<AdminOrgContext | null> => {
  const ctx = await getAdminOrgWithStatus()
  if (!ctx || ctx.subscriptionStatus === 'pending') return null
  return ctx
})

export function soloLectura(ctx: AdminOrgContext): boolean {
  return ctx.subscriptionStatus === 'suspended'
}

// Para los server actions que modifican algo: igual que getCurrentOrgForAdmin, pero con un error
// que explica por qué no se puede si la cuenta está suspendida.
export async function getOrgParaEditar(): Promise<AdminOrgContext> {
  const ctx = await getAdminOrgWithStatus()
  if (ctx && soloLectura(ctx)) {
    throw new Error('Tu suscripción está suspendida. Reactivala desde Mi suscripción para volver a editar.')
  }
  if (!ctx || adminBloqueado(ctx)) throw new Error('No se pudo resolver tu tienda. Volvé a iniciar sesión.')
  return ctx
}
