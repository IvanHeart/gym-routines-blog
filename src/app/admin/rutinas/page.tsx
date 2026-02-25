import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminRoutinesPanel } from '@/components/admin/admin-routines-panel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Rutinas',
}

export interface AdminRoutine {
  id: string
  title: string
  slug: string
  published: boolean
  created_at: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  views: number
  author: { id: string; username: string } | null
  category: { id: string; name: string; color: string } | null
}

export default async function AdminRutinasPage() {
  const supabase = await createClient()
  const { data: routines } = await supabase
    .from('routines')
    .select(
      `
      id, title, slug, published, created_at, difficulty, views,
      author:profiles!author_id(id, username),
      category:categories!category_id(id, name, color)
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Rutinas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona todas las rutinas de la plataforma
        </p>
      </div>
      <AdminRoutinesPanel routines={(routines ?? []) as AdminRoutine[]} />
    </div>
  )
}
