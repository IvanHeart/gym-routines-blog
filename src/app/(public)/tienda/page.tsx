import type { Metadata } from 'next'
import { getPublishedProducts, getAllProductCategories } from '@/dal/shop.dal'
import { ProductGrid } from '@/components/shop/product-grid'
import { ProductFilters } from '@/components/shop/product-filters'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export const metadata: Metadata = {
  title: 'Tienda — GymRoutines',
  description: 'Encuentra suplementos, ropa y accesorios para tu entrenamiento.',
}

interface Props {
  searchParams: Promise<{
    q?: string
    categoria?: string
    orden?: string
    page?: string
  }>
}

export default async function TiendaPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const [{ products, total }, categories] = await Promise.all([
    getPublishedProducts({
      page,
      limit: 12,
      categorySlug: params.categoria || null,
      search: params.q || null,
      sort: (params.orden as 'price_asc' | 'price_desc' | 'newest' | 'name') || null,
    }),
    getAllProductCategories(),
  ])

  const totalPages = Math.ceil(total / 12)

  function buildPageUrl(p: number) {
    const url = new URLSearchParams()
    if (params.q) url.set('q', params.q)
    if (params.categoria) url.set('categoria', params.categoria)
    if (params.orden) url.set('orden', params.orden)
    url.set('page', String(p))
    return `/tienda?${url.toString()}`
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tienda</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} producto{total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mb-6">
        <ProductFilters categories={categories} />
      </div>

      <ProductGrid products={products} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={buildPageUrl(page - 1)} />
                </PaginationItem>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink href={buildPageUrl(p)} isActive={p === page}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext href={buildPageUrl(page + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
