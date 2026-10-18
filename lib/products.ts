export type Product = {
  id: string
  name: string
  category: string
  description: string
  images: string[]
  sizes: string[]
  active: boolean
  featured: boolean
  created_at: string
  price: number | null
  // Precio "antes" (tachado) que se carga en bg-gestion; solo se muestra si es mayor al actual.
  compareAtPrice?: number | null
  cost?: number | null
  stock: number | null
  productBranchId?: string
  branchActive?: boolean
  weightGrams?: number | null
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
}

export function productImage(product: Product): string {
  return product.images?.[0] ?? '/placeholder.jpg'
}

// Un producto es "nuevo" durante sus primeros 30 días en el catálogo.
const NEW_DAYS = 30

export function isNewProduct(product: Product): boolean {
  const created = new Date(product.created_at).getTime()
  return Number.isFinite(created) && Date.now() - created < NEW_DAYS * 86400000
}

// Pocas unidades: se avisa "Últimas N" en la tarjeta y en la página del producto.
export const LOW_STOCK = 3

export function hasDiscount(product: Product): boolean {
  return product.price != null && product.compareAtPrice != null && product.compareAtPrice > product.price
}
