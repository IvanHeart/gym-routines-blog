import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/entities'

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, color, created_at')
    .order('name')

  if (error) {
    console.error('[DAL] getAllCategories:', error.message)
    return []
  }

  return data ?? []
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, color, created_at')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}
