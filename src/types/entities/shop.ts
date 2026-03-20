export interface ProductCategory {
  id: string
  name: string
  slug: string
  color: string
  created_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  brand: string | null
  weight: number | null
  dimensions: string | null
  category_id: string | null
  published: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  // Relations (optional, depend on join)
  category?: Pick<ProductCategory, 'id' | 'name' | 'slug' | 'color'>
  images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  order_index: number
  created_at: string
}

export interface Cart {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Pick<
    Product,
    'id' | 'name' | 'slug' | 'price' | 'stock' | 'published' | 'deleted_at'
  > & {
    images?: Pick<ProductImage, 'url' | 'order_index'>[]
  }
}

export interface ShippingAddress {
  id: string
  user_id: string
  full_name: string
  phone: string
  address_line: string
  city: string
  state: string
  postal_code: string
  country: string
  notes: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: number
  user_id: string
  status: OrderStatus
  total: number
  shipping_address_id: string
  notes: string | null
  created_at: string
  updated_at: string
  // Relations
  items?: OrderItem[]
  shipping_address?: ShippingAddress
  user?: { id: string; username: string; full_name: string | null }
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  created_at: string
}

/** Shape stored in localStorage for guest carts */
export interface LocalCartItem {
  productId: string
  quantity: number
}
