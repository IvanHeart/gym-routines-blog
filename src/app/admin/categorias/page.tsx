import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CategoryAdminPanel } from '@/components/admin/category-admin-panel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Categorías',
}

export default async function AdminCategoriasPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, color, created_at')
    .order('name')

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea y edita las categorías disponibles
        </p>
      </div>
      <CategoryAdminPanel categories={categories ?? []} />
    </div>
  )
}
