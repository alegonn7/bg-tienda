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
}

export const categories = [
  'Todos',
  'Chapita',
  'Llavero',
  'Prendedor',
  'Destapador',
  'Imán',
  'Colgante',
  'Espejo',
  'Aprietapapel',
]

export const productCategories = categories.filter((c) => c !== 'Todos')

export function productImage(product: Product): string {
  return product.images?.[0] ?? '/placeholder.jpg'
}
