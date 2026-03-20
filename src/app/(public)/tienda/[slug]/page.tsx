import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getProductBySlug } from '@/dal/shop.dal'
import { ProductDetail } from '@/components/shop/product-detail'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: `${product.name} — Tienda GymRoutines`,
    description: product.description.slice(0, 160),
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/tienda"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a tienda
      </Link>

      <ProductDetail product={product} />
    </div>
  )
}
