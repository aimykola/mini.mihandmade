'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Product } from '@/lib/products'

export type CartItem = { product: Product; qty: number; size?: string; color?: string }

type CartContextType = {
  items: CartItem[]
  isOpen: boolean
  open: () => void
  close: () => void
  add: (product: Product, size?: string, color?: string) => void
  remove: (id: string, size?: string, color?: string) => void
  setQty: (id: string, qty: number, size?: string, color?: string) => void
  clear: () => void
  count: number
  total: number
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'minimi_cart'

// Two cart lines are the same only if product id AND chosen size AND chosen color all match.
const sameLine = (i: CartItem, id: string, size?: string, color?: string) =>
  i.product.id === id && (i.size ?? '') === (size ?? '') && (i.color ?? '') === (color ?? '')

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

  const add = (product: Product, size?: string, color?: string) => {
    setItems((prev) => {
      const found = prev.find((i) => sameLine(i, product.id, size, color))
      if (found) return prev.map((i) => (sameLine(i, product.id, size, color) ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { product, qty: 1, size, color }]
    })
    setIsOpen(true)
  }

  const remove = (id: string, size?: string, color?: string) =>
    setItems((prev) => prev.filter((i) => !sameLine(i, id, size, color)))

  const setQty = (id: string, qty: number, size?: string, color?: string) =>
    setItems((prev) =>
      prev.flatMap((i) => {
        if (!sameLine(i, id, size, color)) return [i]
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
