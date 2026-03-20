'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/components/providers/session-provider'
import {
  addToCartAction,
  updateCartItemAction,
  removeCartItemAction,
  syncCartAction,
  getCartItemsAction,
} from '@/actions/cart.actions'
import type { CartItemWithProduct } from '@/actions/cart.actions'
import type { LocalCartItem } from '@/types/entities'

export type { CartItemWithProduct }

const CART_KEY = 'gym-shop-cart'

function getLocalCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
  } catch {
    return []
  }
}

function setLocalCart(items: LocalCartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

function clearLocalCart() {
  localStorage.removeItem(CART_KEY)
}

export interface UseCartReturn {
  items: CartItemWithProduct[]
  count: number
  total: number
  addItem: (
    productId: string,
    qty: number,
    productInfo?: {
      name: string
      slug: string
      price: number
      stock: number
      imageUrl: string | null
    }
  ) => Promise<void>
  updateQuantity: (productId: string, qty: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clearCart: () => void
  isLoading: boolean
  refresh: () => void
}

export function useCart(): UseCartReturn {
  const { user } = useSession()
  const [items, setItems] = useState<CartItemWithProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const hasSynced = useRef(false)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // Load cart
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      if (user) {
        // Sync localStorage items on first load with session
        if (!hasSynced.current) {
          const local = getLocalCart()
          if (local.length > 0) {
            await syncCartAction(local)
            clearLocalCart()
          }
          hasSynced.current = true
        }

        // Fetch from server via server action
        const data = await getCartItemsAction()
        if (!cancelled) setItems(data)
      } else {
        // Read localStorage
        const local = getLocalCart()
        const localItems: CartItemWithProduct[] = local.map((l) => ({
          productId: l.productId,
          name: '',
          slug: '',
          price: 0,
          stock: 999,
          quantity: l.quantity,
          imageUrl: null,
          available: true,
        }))
        if (!cancelled) setItems(localItems)
      }

      if (!cancelled) setIsLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, refreshKey])

  const addItem = useCallback(
    async (
      productId: string,
      qty: number,
      productInfo?: {
        name: string
        slug: string
        price: number
        stock: number
        imageUrl: string | null
      }
    ) => {
      if (user) {
        const fd = new FormData()
        fd.set('productId', productId)
        fd.set('quantity', String(qty))
        await addToCartAction(null, fd)
        refresh()
      } else {
        const local = getLocalCart()
        const existing = local.find((i) => i.productId === productId)
        if (existing) {
          existing.quantity += qty
        } else {
          local.push({ productId, quantity: qty })
        }
        setLocalCart(local)
        if (productInfo) {
          setItems((prev) => {
            const idx = prev.findIndex((i) => i.productId === productId)
            if (idx >= 0) {
              const updated = [...prev]
              const existing = updated[idx]!
              updated[idx] = { ...existing, quantity: existing.quantity + qty }
              return updated
            }
            return [...prev, { ...productInfo, productId, quantity: qty, available: true }]
          })
        }
      }
    },
    [user, refresh]
  )

  const updateQuantity = useCallback(
    async (productId: string, qty: number) => {
      if (user) {
        await updateCartItemAction(productId, qty)
        refresh()
      } else {
        const local = getLocalCart()
        const item = local.find((i) => i.productId === productId)
        if (item) {
          item.quantity = qty
          setLocalCart(local)
          setItems((prev) =>
            prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
          )
        }
      }
    },
    [user, refresh]
  )

  const removeItem = useCallback(
    async (productId: string) => {
      if (user) {
        await removeCartItemAction(productId)
        refresh()
      } else {
        const local = getLocalCart().filter((i) => i.productId !== productId)
        setLocalCart(local)
        setItems((prev) => prev.filter((i) => i.productId !== productId))
      }
    },
    [user, refresh]
  )

  const clearCart = useCallback(() => {
    if (!user) {
      clearLocalCart()
      setItems([])
    }
  }, [user])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return {
    items,
    count,
    total,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    isLoading,
    refresh,
  }
}
