'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgForAdmin } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

function revalidateStorefront() {
  // No conocemos el slug puntual acá sin una query extra — se invalida el segmento dinámico
  // completo (todas las tiendas), soportado nativamente por Next.js.
  revalidatePath('/[slug]', 'layout')
  revalidatePath('/admin')
}

type ProductData = {
  name: string
  categoryId: string
  description: string
  images: string[]
  sizes: string[]
  active: boolean
  price: number
  stock: number
}

export async function createProduct(data: ProductData) {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) throw new Error('No se pudo resolver tu tienda. Volvé a iniciar sesión.')

  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      organization_id: ctx.organizationId,
      name: data.name,
      category_id: data.categoryId || null,
      description: data.description,
      images: data.images,
      sizes: data.sizes,
      is_active: data.active,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  const { error: branchError } = await supabase.from('products_branch').insert({
    product_id: product.id,
    branch_id: ctx.onlineBranchId,
    price_sale: data.price,
    stock_quantity: data.stock,
    created_by: ctx.userId,
  })
  if (branchError) throw new Error(branchError.message)

  revalidateStorefront()
}

export async function updateProduct(id: string, productBranchId: string, data: ProductData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update({
      name: data.name,
      category_id: data.categoryId || null,
      description: data.description,
      images: data.images,
      sizes: data.sizes,
      is_active: data.active,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  const { error: branchError } = await supabase
    .from('products_branch')
    .update({ price_sale: data.price, stock_quantity: data.stock })
    .eq('id', productBranchId)
  if (branchError) throw new Error(branchError.message)

  revalidateStorefront()
}

// Saca el producto de la tienda online — desactiva su fila de products_branch (is_active=false)
// en vez de borrarla. store_catalog ya filtra por pb.is_active = true, así que esto alcanza para
// que deje de aparecer en la tienda. No se borra nada: es reversible (restoreProductToStore) y
// no arriesga romper un delete real con historial de ventas/movimientos ligados a esa fila.
export async function removeProductFromStore(productBranchId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products_branch')
    .update({ is_active: false })
    .eq('id', productBranchId)
  if (error) throw new Error(error.message)
  revalidateStorefront()
}

export async function restoreProductToStore(productBranchId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products_branch')
    .update({ is_active: true })
    .eq('id', productBranchId)
  if (error) throw new Error(error.message)
  revalidateStorefront()
}

export async function toggleProductFeatured(id: string, featured: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').update({ featured }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateStorefront()
}

export async function toggleProductActive(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').update({ is_active: active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateStorefront()
}

// Categorías
export async function createCategory(name: string) {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) throw new Error('No se pudo resolver tu tienda. Volvé a iniciar sesión.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .insert({ name, organization_id: ctx.organizationId })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
  revalidateStorefront()
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
  revalidateStorefront()
}

// Tamaños
export async function createSize(name: string) {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) throw new Error('No se pudo resolver tu tienda. Volvé a iniciar sesión.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('sizes')
    .insert({ name, organization_id: ctx.organizationId })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/tamanos')
}

export async function deleteSize(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sizes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/tamanos')
}

// Hero images
export async function deleteHeroImage(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('hero_images').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/hero')
  revalidateStorefront()
}

// Pedidos
export async function confirmOrder(orderId: string) {
  const supabase = await createClient()
  // confirm_store_order ya valida adentro que el pedido sea de la organización del usuario
  // logueado (deriva todo de auth.uid(), ver Fase 01) — no hace falta repetir ese chequeo acá.
  const { error } = await supabase.rpc('confirm_store_order', { p_store_order_id: orderId })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/pedidos')
  revalidateStorefront()
}

export async function cancelOrder(orderId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('store_orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('status', 'pending')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/pedidos')
}

// Branding de la tienda — nombre público, textos del hero, color, contacto. El slug (URL de la
// tienda) NO se edita desde acá a propósito: cambiarlo rompe links ya compartidos, queda del
// lado de admin-gestion/soporte.
type StoreBrandingData = {
  storeName: string
  heroTitle: string
  heroSubtitle: string
  accentColor: string
  whatsappNumber: string
  instagramUrl: string
  facebookUrl: string
  showPrices: boolean
  features: { title: string; text: string; icon?: string }[]
}

export async function updateStoreBranding(data: StoreBrandingData) {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) throw new Error('No se pudo resolver tu tienda. Volvé a iniciar sesión.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('store_settings')
    .update({
      store_name: data.storeName || null,
      hero_title: data.heroTitle || null,
      hero_subtitle: data.heroSubtitle || null,
      accent_color: data.accentColor || null,
      whatsapp_number: data.whatsappNumber || null,
      instagram_url: data.instagramUrl || null,
      facebook_url: data.facebookUrl || null,
      show_prices: data.showPrices,
      features: data.features
        .filter((f) => f.title.trim())
        .map((f) => ({ title: f.title.trim(), text: f.text.trim(), icon: f.icon ?? 'star' })),
    })
    .eq('id', ctx.storeSettingsId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracion')
  revalidateStorefront()
}

// Favicon — el ícono de la pestaña del navegador, propio de cada tienda (store_settings.favicon_url).
// Funciona por tienda porque cada ruta /[slug] define su propio <link rel="icon"> vía
// generateMetadata (ver app/[slug]/layout.tsx) — no es un único favicon para todo el dominio.
// Si una tienda no carga uno, cae al default compartido (/favicon.png).
export async function updateStoreFavicon(faviconUrl: string) {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) throw new Error('No se pudo resolver tu tienda. Volvé a iniciar sesión.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('store_settings')
    .update({ favicon_url: faviconUrl })
    .eq('id', ctx.storeSettingsId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracion')
  revalidateStorefront()
}

// Logo — vive en organizations.logo_url, el mismo campo que ya usa bg-gestion, así que
// cambiarlo acá también lo actualiza ahí. RLS solo deja actualizar "organizations" al
// owner de la organización (ver policy "Owners can update their organization"); si un
// admin/employee intenta usar esto, el update no matchea ninguna fila y .single() tira
// error en vez de fallar en silencio.
export async function updateStoreLogo(logoUrl: string) {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) throw new Error('No se pudo resolver tu tienda. Volvé a iniciar sesión.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('organizations')
    .update({ logo_url: logoUrl })
    .eq('id', ctx.organizationId)
    .select('id')
    .single()
  if (error) throw new Error('Solo el dueño de la tienda puede cambiar el logo.')
  revalidatePath('/admin/configuracion')
  revalidateStorefront()
}

// Cómo se ve la marca en el navbar: tamaño del logo (px) y si se muestra el logo, el nombre,
// o los dos juntos.
export async function updateStoreLogoDisplay(data: { logoHeight: number; headerDisplay: string }) {
  const ctx = await getCurrentOrgForAdmin()
  if (!ctx) throw new Error('No se pudo resolver tu tienda. Volvé a iniciar sesión.')

  const supabase = await createClient()
  const { error } = await supabase
    .from('store_settings')
    .update({ logo_height: data.logoHeight, header_display: data.headerDisplay })
    .eq('id', ctx.storeSettingsId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracion')
  revalidateStorefront()
}
