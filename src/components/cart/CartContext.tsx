'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Product } from '@/lib/products'

export type CartItem = { product: Product; qty: number }

type CartContextType = {
  items: CartItem[]
    isOpen: boolean
      open: () => void
        close: () => void
          add: (product: Product) => void
            remove: (id: string) => void
              setQty: (id: string, qty: number) => void
                clear: () => void
                  count: number
                    total: number
                    }

                    const CartContext = createContext<CartContextType | null>(null)

                    const STORAGE_KEY = 'minimi_cart'

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

                                                                    const add = (product: Product) => {
                                                                        setItems((prev) => {
                                                                              const found = prev.find((i) => i.product.id === product.id)
                                                                                    if (found) return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i))
                                                                                          return [...prev, { product, qty: 1 }]
                                                                                              })
                                                                                                  setIsOpen(true)
                                                                                                    }
                                                                                                    
                                                                                                      const remove = (id: string) => setItems((prev) => prev.filter((i) => i.product.id !== id))
                                                                                                      
                                                                                                        const setQty = (id: string, qty: number) =>
                                                                                                            setItems((prev) =>
                                                                                                                  prev.flatMap((i) => {
                                                                                                                          if (i.product.id !== id) return [i]
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
                                                                                                                                                                                                              
