'use client'

import { createContext, useContext } from 'react'
import { useCart, type UseCartReturn } from '@/hooks/use-cart'

const CartContext = createContext<UseCartReturn | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart()
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>
}

export function useCartContext(): UseCartReturn {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext must be used within CartProvider')
  return ctx
}
