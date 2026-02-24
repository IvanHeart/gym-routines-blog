import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createSearchParamsCache, parseAsString, parseAsInteger } from 'nuqs/server'
import { getAllCategories } from '@/dal/categories.dal'
import { getPublishedRoutines } from '@/dal/routines.dal'
import { CategoryFilter } from '@/components/shared/category-filter'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { RutinaGrid } from '@/components/rutinas/rutina-grid'
import { RutinaGridSkeleton } from '@/components/rutinas/rutina-card-skeleton'
import type { Difficulty } from '@/types/entities'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'GymRoutines — Comparte tus rutinas de gimnasio',
  description:
    'Descubre y comparte las mejores rutinas de gimnasio. Entrena mejor con rutinas creadas por la comunidad.',
  openGraph: {
    title: 'GymRoutines — Comparte tus rutinas de gimnasio',
    description: 'Descubre y comparte las mejores rutinas de gimnasio.',
    type: 'website',
  },
}

const searchParamsCache = createSearchParamsCache({
  category: parseAsString.withDefault(''),
  difficulty: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
})

const PAGE_SIZE = 9

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category, difficulty, page } = await searchParamsCache.parse(searchParams)

  const [categories, { routines, total }] = await Promise.all([
    getAllCategories(),
    getPublishedRoutines({
      page,
      limit: PAGE_SIZE,
      categorySlug: category || null,
      difficulty: (difficulty as Difficulty) || null,
    }),
  ])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.65_0.25_293/0.15),transparent)]" />
        <div className="container mx-auto px-4 py-16 text-center md:py-20">
          <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Comparte tu{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              entrenamiento
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Descubre rutinas creadas por la comunidad. Encuentra tu nivel, copia el plan y empieza a
            entrenar hoy.
          </p>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="container mx-auto px-4 py-10">
        {/* Filtros */}
        <div className="mb-8 flex flex-col gap-4">
          <Suspense>
            <CategoryFilter categories={categories} />
          </Suspense>
        </div>

        {/* Grid de rutinas */}
        <Suspense fallback={<RutinaGridSkeleton count={PAGE_SIZE} />}>
          <RutinaGrid routines={routines} />
        </Suspense>

        {/* Paginación */}
        {total > PAGE_SIZE && (
          <div className="mt-10">
            <Suspense>
              <PaginationControls total={total} limit={PAGE_SIZE} />
            </Suspense>
          </div>
        )}
      </section>
    </>
  )
}
