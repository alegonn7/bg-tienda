import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type Store = {
  organizationId: string
  organizationName: string
  slug: string
  branchId: string
  storeName: string | null
  logoUrl: string | null
  faviconUrl: string | null
  accentColor: string | null
  whatsappNumber: string | null
  whatsappMessageTemplate: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  showPrices: boolean
  paymentOnlineEnabled: boolean
}

// Resuelve slug -> tienda pública. Usa la vista store_directory (Fase 01), que ya filtra por
// enabled=true y solo expone columnas seguras para un visitante sin sesión.
export const getStoreBySlug = cache(async (slug: string): Promise<Store | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_directory')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return null

  return {
    organizationId: data.organization_id,
    organizationName: data.organization_name,
    slug: data.slug,
    branchId: data.branch_id,
    storeName: data.store_name,
    logoUrl: data.logo_url,
    faviconUrl: data.favicon_url,
    accentColor: data.accent_color,
    whatsappNumber: data.whatsapp_number,
    whatsappMessageTemplate: data.whatsapp_message_template,
    instagramUrl: data.instagram_url,
    facebookUrl: data.facebook_url,
    showPrices: data.show_prices,
    paymentOnlineEnabled: data.payment_online_enabled,
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
  faviconUrl: string | null
}

// Resuelve la organización del usuario logueado a partir de su sesión (nunca de la URL — ver
// Fase 04). Devuelve null si no hay sesión, si el usuario no pertenece a ninguna organización,
// o si su organización no tiene bg-tienda habilitada — en cualquiera de esos casos /admin debe
// mostrar un estado claro en vez de intentar operar sin organización resuelta.
export const getCurrentOrgForAdmin = cache(async (): Promise<AdminOrgContext | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userRow } = await supabase
    .from('users')
    .select('id, organization_id, role, organizations(slug, name)')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!userRow) return null

  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('id, branch_id, enabled, favicon_url, store_name')
    .eq('organization_id', userRow.organization_id)
    .maybeSingle()

  if (!storeSettings || !storeSettings.enabled) return null

  const org = userRow.organizations as unknown as { slug: string; name: string } | null

  return {
    userId: userRow.id,
    organizationId: userRow.organization_id,
    organizationSlug: org?.slug ?? '',
    organizationName: org?.name ?? '',
    storeName: storeSettings.store_name,
    role: userRow.role,
    onlineBranchId: storeSettings.branch_id,
    storeSettingsId: storeSettings.id,
    faviconUrl: storeSettings.favicon_url,
  }
})
