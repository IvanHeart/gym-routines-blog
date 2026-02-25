import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Routine, Difficulty } from '@/types/entities'

const ROUTINE_SELECT = `
  id, title, slug, excerpt, cover_image_url, difficulty,
  duration_minutes, views, created_at, author_id, category_id,
  author:profiles!author_id(id, username, avatar_url),
  category:categories(id, name, slug, color)
` as const

export interface RoutineWithRelations extends Omit<Routine, 'author' | 'category'> {
  author: { id: string; username: string; avatar_url: string | null } | null
  category: { id: string; name: string; slug: string; color: string } | null
}

export interface GetRoutinesOptions {
  page?: number
  limit?: number
  categorySlug?: string | null
  difficulty?: Difficulty | null
}

export interface RoutinesResult {
  routines: RoutineWithRelations[]
  total: number
}

export async function getPublishedRoutines({
  page = 1,
  limit = 9,
  categorySlug,
  difficulty,
}: GetRoutinesOptions = {}): Promise<RoutinesResult> {
  const supabase = await createClient()

  let query = supabase
    .from('routines')
    .select(ROUTINE_SELECT, { count: 'exact' })
    .eq('published', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('[DAL] getPublishedRoutines:', error.message)
    return { routines: [], total: 0 }
  }

  return {
    routines: (data ?? []) as RoutineWithRelations[],
    total: count ?? 0,
  }
}

export async function getAllPublishedSlugs(): Promise<string[]> {
  // Uses admin client so it works in generateStaticParams (no request context)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('routines')
    .select('slug')
    .eq('published', true)
    .is('deleted_at', null)

  if (error) return []
  return (data ?? []).map((r) => r.slug)
}

export async function getRoutineBySlug(slug: string): Promise<RoutineWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('routines')
    .select(
      `${ROUTINE_SELECT},
      exercises(id, name, sets, reps, rest_seconds, notes, order_index),
      content, published, deleted_at, updated_at`
    )
    .eq('slug', slug)
    .eq('published', true)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as RoutineWithRelations
}
