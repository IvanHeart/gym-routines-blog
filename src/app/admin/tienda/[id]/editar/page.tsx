import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductById, getAllProductCategories } from '@/dal/shop.dal'
import { ProductForm } from '@/components/shop/product-form'

export const metadata: Metadata = {
  title: 'Admin — Editar Producto',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminEditarProductoPage({ params }: Props) {
  const { id } = await params
  const [product, categories] = await Promise.all([getProductById(id), getAllProductCategories()])

  if (!product) notFound()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Editar Producto</h1>
        <p className="text-sm text-muted-foreground mt-1">{product.name}</p>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  )
}
