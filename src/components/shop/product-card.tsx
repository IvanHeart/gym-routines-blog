'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/currency'
import { useCartContext } from '@/components/cart/cart-provider'
import type { Product } from '@/types/entities'

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartContext()
  const mainImage = product.images?.sort((a, b) => a.order_index - b.order_index)?.[0]
  const outOfStock = product.stock <= 0

  async function handleAdd() {
    await addItem(product.id, 1, {
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      imageUrl: mainImage?.url ?? null,
    })
    toast.success('Agregado al carrito')
  }

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/40 transition-colors">
      <Link href={`/tienda/${product.slug}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={product.name}
              width={400}
              height={400}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        {product.category && (
          <Badge
            variant="outline"
            className="mb-2 text-[10px]"
            style={{ borderColor: product.category.color, color: product.category.color }}
          >
            {product.category.name}
          </Badge>
        )}
        <Link href={`/tienda/${product.slug}`}>
          <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.brand && <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          {outOfStock ? (
            <Badge variant="secondary">Agotado</Badge>
          ) : (
            <Button size="sm" variant="default" onClick={handleAdd}>
              <ShoppingCart className="mr-1 h-4 w-4" />
              Agregar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
