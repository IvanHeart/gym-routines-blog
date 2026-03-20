import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Order, OrderStatus } from '@/types/entities'

const ORDER_SELECT = `
  id, order_number, user_id, status, total, shipping_address_id, notes,
  created_at, updated_at,
  items:order_items(id, product_id, product_name, quantity, unit_price),
  shipping_address:shipping_addresses(id, full_name, phone, address_line, city, state, postal_code, country, notes)
` as const

/** User: get own orders */
export async function getMyOrders({
  userId,
  page = 1,
  limit = 10,
}: {
  userId: string
  page?: number
  limit?: number
}): Promise<{ orders: Order[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('orders')
    .select(ORDER_SELECT, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[DAL] getMyOrders:', error.message)
    return { orders: [], total: 0 }
  }

  return { orders: (data ?? []) as unknown as Order[], total: count ?? 0 }
}

/** User: get single order */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .single()

  if (error) return null
  return data as unknown as Order
}

/** Admin: get all orders with filters */
export async function getAdminOrders({
  page = 1,
  limit = 20,
  status,
  search,
}: {
  page?: number
  limit?: number
  status?: OrderStatus | null
  search?: string | null
} = {}): Promise<{ orders: Order[]; total: number }> {
  const supabase = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('orders')
    .select(`${ORDER_SELECT}, user:profiles!user_id(id, username, full_name)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (search) {
    const num = parseInt(search, 10)
    if (!isNaN(num)) {
      query = query.eq('order_number', num)
    }
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[DAL] getAdminOrders:', error.message)
    return { orders: [], total: 0 }
  }

  return { orders: (data ?? []) as unknown as Order[], total: count ?? 0 }
}

/** Admin: get single order with user info */
export async function getAdminOrderById(orderId: string): Promise<Order | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`${ORDER_SELECT}, user:profiles!user_id(id, username, full_name)`)
    .eq('id', orderId)
    .single()

  if (error) return null
  return data as unknown as Order
}
