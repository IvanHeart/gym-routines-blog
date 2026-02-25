import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminCommentsPanel } from '@/components/admin/admin-comments-panel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Comentarios',
}

export default async function AdminComentariosPage() {
  const supabase = await createClient()
  const { data: comments } = await supabase
    .from('comments')
    .select(
      `
      id, content, created_at, author_id, routine_id,
      author:profiles!author_id(id, username),
      routine:routines!routine_id(id, title, slug)
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Comentarios</h1>
        <p className="text-sm text-muted-foreground mt-1">Modera los comentarios de la comunidad</p>
      </div>
      <AdminCommentsPanel comments={(comments ?? []) as AdminComment[]} />
    </div>
  )
}

export interface AdminComment {
  id: string
  content: string
  created_at: string
  author_id: string
  routine_id: string
  author: { id: string; username: string } | null
  routine: { id: string; title: string; slug: string } | null
}
