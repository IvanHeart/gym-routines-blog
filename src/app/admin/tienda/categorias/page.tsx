import type { Metadata } from 'next'
import { getAllProductCategories } from '@/dal/shop.dal'
import { ProductCategoryForm } from '@/components/shop/product-category-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Categorías de Tienda',
}

export default async function AdminProductCategoriasPage() {
  const categories = await getAllProductCategories()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Categorías de Tienda</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea y gestiona las categorías de productos
        </p>
      </div>
      <ProductCategoryForm categories={categories} />
    </div>
  )
}
