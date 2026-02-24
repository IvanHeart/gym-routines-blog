import { createClient } from '@/lib/supabase/server'

export async function getUserFavorite(routineId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('routine_id', routineId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!data
}

export async function getRoutineFavoritesCount(routineId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('routine_id', routineId)

  return count ?? 0
}
