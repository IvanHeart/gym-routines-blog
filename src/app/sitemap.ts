import type { MetadataRoute } from 'next'
import { getAllPublishedSlugs } from '@/dal/routines.dal'
import { getAllCategories } from '@/dal/categories.dal'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gymroutines.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories] = await Promise.all([getAllPublishedSlugs(), getAllCategories()])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/buscar`, changeFrequency: 'daily', priority: 0.8 },
  ]

  const routineRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE_URL}/rutinas/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/categorias/${cat.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...routineRoutes, ...categoryRoutes]
}
