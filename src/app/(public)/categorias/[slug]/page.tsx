import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllCategories, getCategoryBySlug } from '@/dal/categories.dal'
import { getPublishedRoutines } from '@/dal/routines.dal'
import { RutinaGrid } from '@/components/rutinas/rutina-grid'
import { CategoryBadge } from '@/components/shared/category-badge'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const categories = await getAllCategories()
  return categories.map((cat) => ({ slug: cat.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Categoría no encontrada' }
  return {
    title: `Rutinas de ${category.name}`,
    description: `Descubre las mejores rutinas de ${category.name} en GymRoutines.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const { routines } = await getPublishedRoutines({
    categorySlug: slug,
    limit: 50,
  })

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex items-center gap-3">
        <CategoryBadge name={category.name} color={category.color} className="text-sm px-3 py-1" />
        <div>
          <h1 className="text-2xl font-bold">Rutinas de {category.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{routines.length} rutinas</p>
        </div>
      </header>

      <RutinaGrid routines={routines} />
    </div>
  )
}
