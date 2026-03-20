import type { Metadata } from 'next'
import { getAllProductCategories } from '@/dal/shop.dal'
import { ProductForm } from '@/components/shop/product-form'

export const metadata: Metadata = {
  title: 'Admin — Nuevo Producto',
}

export default async function AdminNuevoProductoPage() {
  const categories = await getAllProductCategories()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Nuevo Producto</h1>
        <p className="text-sm text-muted-foreground mt-1">Crea un nuevo producto para la tienda</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}
