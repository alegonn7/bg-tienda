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
  stock: number | null
  productBranchId?: string
  branchActive?: boolean
}

export function productImage(product: Product): string {
  return product.images?.[0] ?? '/placeholder.jpg'
}
