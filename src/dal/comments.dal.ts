import { createClient } from '@/lib/supabase/server'
import type { Comment } from '@/types/entities'

export type CommentWithAuthor = Omit<Comment, 'author'> & {
  author: { id: string; username: string; avatar_url: string | null } | null
}

export async function getRoutineComments(routineId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .select(
      'id, routine_id, author_id, content, deleted_at, created_at, author:profiles!author_id(id, username, avatar_url)'
    )
    .eq('routine_id', routineId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[DAL] getRoutineComments:', error.message)
    return []
  }

  return (data ?? []) as CommentWithAuthor[]
}
