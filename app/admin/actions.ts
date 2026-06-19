'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ProductData = {
  name: string
  category: string
  description: string
  images: string[]
  sizes: string[]
  active: boolean
}

export async function createProduct(data: ProductData) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/productos')
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function updateProduct(id: string, data: ProductData) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/productos')
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/productos')
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function toggleProductFeatured(id: string, featured: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').update({ featured }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function toggleProductActive(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ active })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/productos')
  revalidatePath('/')
  revalidatePath('/admin')
}

// Categorías
export async function createCategory(name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').insert({ name })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
  revalidatePath('/productos')
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
  revalidatePath('/productos')
}

// Hero images
export async function deleteHeroImage(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('hero_images').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/hero')
}

// Medidas
export async function createSize(name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sizes').insert({ name })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/medidas')
}

export async function deleteSize(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sizes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/medidas')
}

// Settings
export async function saveSetting(key: string, value: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  revalidatePath('/admin/configuracion')
}
