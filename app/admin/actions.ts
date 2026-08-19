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

// Solo saca el producto de la tienda online (borra su fila de products_branch en la sucursal
// online) — NO borra el producto "maestro" (products), que puede seguir en uso en otras
// sucursales de bg-gestion. Un delete real del maestro no es una operación segura desde acá.
export async function removeProductFromStore(productBranchId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products_branch').delete().eq('id', productBranchId)
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

// Favicon (antes vivía en la tabla genérica "settings" de Pins-crew — ahora es
// store_settings.favicon_url, por organización).
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
