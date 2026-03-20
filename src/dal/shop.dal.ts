import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Product, ProductCategory } from '@/types/entities'

// ─── Product Categories ───────────────────────────────────────

export async function getAllProductCategories(): Promise<ProductCategory[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('product_categories')
    .select('id, name, slug, color, created_at')
    .order('name')

  if (error) {
    console.error('[DAL] getAllProductCategories:', error.message)
    return []
  }
  return data ?? []
}

// ─── Products ─────────────────────────────────────────────────

const PRODUCT_SELECT = `
  id, name, slug, description, price, stock, brand, weight, dimensions,
  category_id, published, deleted_at, created_at, updated_at,
  category:product_categories(id, name, slug, color),
  images:product_images(id, url, order_index)
` as const

export interface GetProductsOptions {
  page?: number
  limit?: number
  categorySlug?: string | null
  search?: string | null
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name' | null
}

export interface ProductsResult {
  products: Product[]
  total: number
}

export async function getPublishedProducts({
  page = 1,
  limit = 12,
  categorySlug,
  search,
  sort,
}: GetProductsOptions = {}): Promise<ProductsResult> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('published', true)
    .is('deleted_at', null)

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('product_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'name':
      query = query.order('name', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('[DAL] getPublishedProducts:', error.message)
    return { products: [], total: 0 }
  }

  return {
    products: (data ?? []) as unknown as Product[],
    total: count ?? 0,
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('published', true)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as unknown as Product
}

/** Admin: get product by ID (includes unpublished) */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as unknown as Product
}

/** Admin: get all products for admin table */
export async function getAdminProducts({
  page = 1,
  limit = 20,
}: { page?: number; limit?: number } = {}): Promise<ProductsResult> {
  const supabase = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[DAL] getAdminProducts:', error.message)
    return { products: [], total: 0 }
  }

  return {
    products: (data ?? []) as unknown as Product[],
    total: count ?? 0,
  }
}
