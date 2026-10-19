import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
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
  compare_at_price: number | null
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
    compareAtPrice: row.compare_at_price ?? null,
    stock: row.stock_quantity,
    productBranchId: row.product_branch_id,
  }
}

// Todo el catálogo visible de la tienda en UNA consulta por render. Inicio, listado, producto,
// menú, pie y carrito sacan de acá lo que necesitan (cache() comparte el resultado dentro del
// mismo request, también con generateMetadata), en vez de ir a Supabase cuatro o cinco veces
// una detrás de otra. El catálogo de una tienda son cientos de filas livianas: traerlo entero
// cuesta lo mismo que traer 8.
const getCatalog = cache(async (organizationId: string): Promise<Product[]> => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('store_catalog')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getCatalog: ${error.message}`)
  return (data ?? []).map(mapCatalogRow)
})

export async function getProducts(organizationId: string, limit?: number): Promise<Product[]> {
  const all = await getCatalog(organizationId)
  return limit ? all.slice(0, limit) : all
}

export async function getFeaturedProducts(organizationId: string): Promise<Product[]> {
  return (await getCatalog(organizationId)).filter((p) => p.featured)
}

export type StoreCategory = { name: string; count: number; image: string | null }

// Categorías con productos visibles, para el menú, el pie y los mosaicos del inicio. Se derivan
// de store_catalog (lo único público, ver Fase 04); la imagen es la del primer producto con foto.
export async function getStoreCategories(organizationId: string): Promise<StoreCategory[]> {
  const byName = new Map<string, StoreCategory>()
  for (const p of await getCatalog(organizationId)) {
    if (!p.category) continue
    const cat = byName.get(p.category) ?? { name: p.category, count: 0, image: null }
    cat.count++
    if (!cat.image && p.images[0]) cat.image = p.images[0]
    byName.set(p.category, cat)
  }
  return [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export async function getProduct(organizationId: string, productId: string): Promise<Product | null> {
  return (await getCatalog(organizationId)).find((p) => p.id === productId) ?? null
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
  weight_grams: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  categories: { name: string } | null
  products_branch: { id: string; price_sale: number | null; price_cost: number | null; stock_quantity: number | null; is_active: boolean }[]
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
    cost: branch?.price_cost ?? null,
    stock: branch?.stock_quantity ?? null,
    productBranchId: branch?.id,
    branchActive: branch?.is_active ?? true,
    weightGrams: row.weight_grams,
    lengthCm: row.length_cm,
    widthCm: row.width_cm,
    heightCm: row.height_cm,
  }
}

const ADMIN_SELECT = '*, categories(name), products_branch!inner(id, price_sale, price_cost, stock_quantity, is_active)'

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
