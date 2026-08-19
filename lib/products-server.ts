import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/products'

// ---------------------------------------------------------------------------
// Storefront público — lee de la vista store_catalog (Fase 01), que ya filtra
// por tienda habilitada, sucursal online, producto activo/visible. Sin esto
// no hace falta volver a filtrar nada acá: lo único que agregamos es el
// organization_id de la tienda que se está mirando (resuelta por slug).
// ---------------------------------------------------------------------------

type CatalogRow = {
  product_id: string
  name: string
  description: string | null
  images: string[] | null
  sizes: string[] | null
  featured: boolean
  category_name: string | null
  product_branch_id: string
  price_sale: number | null
  stock_quantity: number | null
  created_at: string
}

function mapCatalogRow(row: CatalogRow): Product {
  return {
    id: row.product_id,
    name: row.name,
    category: row.category_name ?? '',
    description: row.description ?? '',
    images: row.images ?? [],
    sizes: row.sizes ?? [],
    active: true,
    featured: row.featured,
    created_at: row.created_at,
    price: row.price_sale,
    stock: row.stock_quantity,
    productBranchId: row.product_branch_id,
  }
}

export async function getProducts(organizationId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_catalog')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapCatalogRow)
}

export async function getFeaturedProducts(organizationId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_catalog')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('featured', true)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapCatalogRow)
}

export async function getProduct(organizationId: string, productId: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_catalog')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('product_id', productId)
    .maybeSingle()
  return data ? mapCatalogRow(data) : null
}

// ---------------------------------------------------------------------------
// Admin (/admin) — lee de las tablas reales (products + products_branch),
// con el usuario autenticado. RLS de bg-gestion ya scopea todo por
// organización/rol/sucursal — no hace falta filtrar por organization_id acá,
// solo por la sucursal "online" (onlineBranchId) para no traer el catálogo
// de otras sucursales que la organización pueda tener en bg-gestion.
// ---------------------------------------------------------------------------

type AdminRow = {
  id: string
  name: string
  description: string | null
  images: string[] | null
  sizes: string[] | null
  is_active: boolean
  featured: boolean
  created_at: string
  categories: { name: string } | null
  products_branch: { id: string; price_sale: number | null; stock_quantity: number | null; is_active: boolean }[]
}

function mapAdminRow(row: AdminRow): Product {
  const branch = row.products_branch?.[0]
  return {
    id: row.id,
    name: row.name,
    category: row.categories?.name ?? '',
    description: row.description ?? '',
    images: row.images ?? [],
    sizes: row.sizes ?? [],
    active: row.is_active,
    featured: row.featured,
    created_at: row.created_at,
    price: branch?.price_sale ?? null,
    stock: branch?.stock_quantity ?? null,
    productBranchId: branch?.id,
    branchActive: branch?.is_active ?? true,
  }
}

const ADMIN_SELECT = '*, categories(name), products_branch!inner(id, price_sale, stock_quantity, is_active)'

export async function getAdminProducts(onlineBranchId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(ADMIN_SELECT)
    .eq('products_branch.branch_id', onlineBranchId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapAdminRow)
}

export async function getAdminProduct(onlineBranchId: string, productId: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(ADMIN_SELECT)
    .eq('id', productId)
    .eq('products_branch.branch_id', onlineBranchId)
    .maybeSingle()
  return data ? mapAdminRow(data) : null
}
