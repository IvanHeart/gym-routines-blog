import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/entities'

export async function getAllCategories(): Promise<Category[]> {
  // Uses admin client so it works both in request context and generateStaticParams
  const supabase = createAdminClient()
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
