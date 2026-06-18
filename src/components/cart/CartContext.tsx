'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Product } from '@/lib/products'

export type CartItem = { product: Product; qty: number; size?: string }

type CartContextType = {
  items: CartItem[]
  isOpen: boolean
  open: () => void
  close: () => void
  add: (product: Product, size?: string) => void
  remove: (id: string, size?: string) => void
  setQty: (id: string, qty: number, size?: string) => void
  clear: () => void
  count: number
  total: number
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'minimi_cart'

// Two cart lines are the same only if both product id AND chosen size match.
const sameLine = (i: CartItem, id: string, size?: string) =>
  i.product.id === id && (i.size ?? '') === (size ?? '')

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const add = (product: Product, size?: string) => {
    setItems((prev) => {
      const found = prev.find((i) => sameLine(i, product.id, size))
      if (found) return prev.map((i) => (sameLine(i, product.id, size) ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { product, qty: 1, size }]
    })
    setIsOpen(true)
  }

  const remove = (id: string, size?: string) =>
    setItems((prev) => prev.filter((i) => !sameLine(i, id, size)))

  const setQty = (id: string, qty: number, size?: string) =>
    setItems((prev) =>
      prev.flatMap((i) => {
        if (!sameLine(i, id, size)) return [i]
        if (qty <= 0) return []
        return [{ ...i, qty }]
      })
    )

  const clear = () => setItems([])

  const count = items.reduce((s, i) => s + i.qty, 0)
  const total = items.reduce((s, i) => s + i.qty * i.product.price, 0)

  const value: CartContextType = {
    items,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    add,
    remove,
    setQty,
    clear,
    count,
    total,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
