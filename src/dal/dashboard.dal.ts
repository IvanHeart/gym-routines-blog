import { createClient } from '@/lib/supabase/server'
import type { RoutineWithRelations } from '@/dal/routines.dal'

export interface DashboardStats {
  totalRoutines: number
  totalPublished: number
  totalViews: number
}

export interface MyRoutine extends Pick<
  RoutineWithRelations,
  | 'id'
  | 'title'
  | 'slug'
  | 'difficulty'
  | 'views'
  | 'published'
  | 'created_at'
  | 'cover_image_url'
  | 'category'
> {
  favorites_count: number
}

export async function getMyRoutines(userId: string): Promise<MyRoutine[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('routines')
    .select(
      `
      id, title, slug, difficulty, views, published, created_at, cover_image_url,
      category:categories(id, name, slug, color)
    `
    )
    .eq('author_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DAL] getMyRoutines:', error.message)
    return []
  }

  // Obtener conteo de favoritos por rutina
  const routineIds = (data ?? []).map((r) => r.id)
  const favCounts: Record<string, number> = {}

  if (routineIds.length > 0) {
    const { data: favData } = await supabase
      .from('favorites')
      .select('routine_id')
      .in('routine_id', routineIds)

    for (const fav of favData ?? []) {
      favCounts[fav.routine_id] = (favCounts[fav.routine_id] ?? 0) + 1
    }
  }

  return (data ?? []).map((r) => ({
    ...r,
    category: r.category as MyRoutine['category'],
    favorites_count: favCounts[r.id] ?? 0,
  }))
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const routines = await getMyRoutines(userId)
  return {
    totalRoutines: routines.length,
    totalPublished: routines.filter((r) => r.published).length,
    totalViews: routines.reduce((sum, r) => sum + r.views, 0),
  }
}

export async function getMyFavoriteRoutines(userId: string): Promise<RoutineWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('favorites')
    .select(
      `
      routine:routines!inner(
        id, title, slug, excerpt, cover_image_url, difficulty,
        duration_minutes, views, created_at, author_id, category_id, published, deleted_at,
        author:profiles!author_id(id, username, avatar_url),
        category:categories(id, name, slug, color)
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DAL] getMyFavoriteRoutines:', error.message)
    return []
  }

  return (data ?? [])
    .map((item) => item.routine)
    .filter((r) => r && !r.deleted_at && r.published) as RoutineWithRelations[]
}

export async function getRoutineForEdit(routineId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('routines')
    .select(
      `
      id, title, slug, excerpt, content, difficulty, duration_minutes,
      category_id, published, cover_image_url, author_id,
      exercises(id, name, sets, reps, rest_seconds, notes, order_index)
    `
    )
    .eq('id', routineId)
    .eq('author_id', userId)
    .is('deleted_at', null)
    .single()

  return data
}
