import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createSearchParamsCache, parseAsString, parseAsInteger } from 'nuqs/server'
import { getAllCategories } from '@/dal/categories.dal'
import { createClient } from '@/lib/supabase/server'
import { RutinaGrid } from '@/components/rutinas/rutina-grid'
import { RutinaGridSkeleton } from '@/components/rutinas/rutina-card-skeleton'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { SearchBar } from '@/components/shared/search-bar'
import type { RoutineWithRelations } from '@/dal/routines.dal'
import type { Difficulty } from '@/types/entities'

export const metadata: Metadata = {
  title: 'Buscar rutinas',
  description: 'Busca rutinas de gimnasio por nombre, categoría o dificultad.',
}

const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(''),
  category: parseAsString.withDefault(''),
  difficulty: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
})

const PAGE_SIZE = 12

interface BuscarPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const { q, category, difficulty, page } = await searchParamsCache.parse(searchParams)
  const supabase = await createClient()
  const categories = await getAllCategories()

  let query = supabase
    .from('routines')
    .select(
      `id, title, slug, excerpt, cover_image_url, difficulty,
       duration_minutes, views, created_at, author_id, category_id, published, deleted_at,
       author:profiles!author_id(id, username, avatar_url),
       category:categories(id, name, slug, color)`,
      { count: 'exact' }
    )
    .eq('published', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (q.trim()) {
    query = query.textSearch('search_vector', q.trim(), {
      type: 'websearch',
      config: 'spanish',
    })
  }

  if (category) {
    const cat = categories.find((c) => c.slug === category)
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty as Difficulty)
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, count } = await query.range(from, to)
  const routines = (data ?? []) as RoutineWithRelations[]
  const total = count ?? 0

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Buscar rutinas</h1>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <Suspense>
            <SearchBar />
          </Suspense>

          <Suspense>
            <DifficultySelect />
          </Suspense>
        </div>
      </div>

      {q && (
        <p className="mb-4 text-sm text-muted-foreground">
          {total} resultado{total !== 1 ? 's' : ''} para &ldquo;{q}&rdquo;
        </p>
      )}

      <Suspense fallback={<RutinaGridSkeleton count={PAGE_SIZE} />}>
        <RutinaGrid routines={routines} />
      </Suspense>

      {total > PAGE_SIZE && (
        <div className="mt-10">
          <Suspense>
            <PaginationControls total={total} limit={PAGE_SIZE} />
          </Suspense>
        </div>
      )}
    </div>
  )
}

// Client components para filtros con nuqs
function DifficultySelect() {
  return null // Se implementa en client component abajo
}
