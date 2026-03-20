import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/types/entities'

const CART_ITEM_SELECT = `
  id, cart_id, product_id, quantity, created_at,
  product:products(id, name, slug, price, stock, published, deleted_at,
    images:product_images(url, order_index)
  )
` as const

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const supabase = await createClient()

  const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).single()

  if (!cart) return []

  const { data, error } = await supabase
    .from('cart_items')
    .select(CART_ITEM_SELECT)
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[DAL] getCartItems:', error.message)
    return []
  }

  return (data ?? []) as unknown as CartItem[]
}
