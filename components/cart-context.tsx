'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Product } from '@/lib/products'

export type CartItem = {
  key: string
  product: Product
  size?: string
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  isOpen: boolean
  totalCount: number
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product, quantity?: number, size?: string) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const addItem = useCallback((product: Product, quantity = 1, size?: string) => {
    const key = `${product.id}::${size ?? ''}`
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i,
        )
      }
      return [...prev, { key, product, size, quantity }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }, [])

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity: Math.max(1, quantity) } : i))
        .filter((i) => i.quantity > 0),
    )
  }, [])

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        totalCount,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

const WHATSAPP_NUMBER = '542241579045'

export function buildWhatsAppLink(items: CartItem[]) {
  const lines = items.map((i) => {
    const size = i.size ? ` — Medida: ${i.size}` : ''
    return `• ${i.product.name}${size} (x${i.quantity})`
  })
  const message = `Hola PinsCrew! Quiero consultar por el siguiente pedido:\n\n${lines.join(
    '\n',
  )}\n\nGracias!`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
