'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/currency'
import { useCartContext } from '@/components/cart/cart-provider'
import { ProductImageGallery } from './product-image-gallery'
import type { Product } from '@/types/entities'

export function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartContext()
  const router = useRouter()
  const outOfStock = product.stock <= 0
  const mainImage = product.images?.sort((a, b) => a.order_index - b.order_index)?.[0]

  async function handleAddToCart() {
    await addItem(product.id, quantity, {
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      imageUrl: mainImage?.url ?? null,
    })
    toast.success('Agregado al carrito')
  }

  async function handleBuyNow() {
    await handleAddToCart()
    router.push('/checkout')
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Images */}
      <ProductImageGallery images={product.images ?? []} />

      {/* Info */}
      <div className="space-y-4">
        {product.category && (
          <Badge
            variant="outline"
            style={{ borderColor: product.category.color, color: product.category.color }}
          >
            {product.category.name}
          </Badge>
        )}

        <h1 className="text-2xl font-bold">{product.name}</h1>

        {product.brand && <p className="text-sm text-muted-foreground">Marca: {product.brand}</p>}

        <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>

        <p className="text-sm text-muted-foreground">
          {outOfStock ? 'Sin stock' : `${product.stock} disponibles`}
        </p>

        {product.weight && <p className="text-sm text-muted-foreground">Peso: {product.weight}g</p>}
        {product.dimensions && (
          <p className="text-sm text-muted-foreground">Dimensiones: {product.dimensions}</p>
        )}

        {/* Quantity selector */}
        {!outOfStock && (
          <div className="flex items-center gap-3">
            <span className="text-sm">Cantidad:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleAddToCart} disabled={outOfStock} className="w-full">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Agregar al carrito
          </Button>
          <Button onClick={handleBuyNow} disabled={outOfStock} variant="outline" className="w-full">
            Comprar ahora
          </Button>
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-border">
          <h2 className="text-sm font-semibold mb-2">Descripción</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
        </div>
      </div>
    </div>
  )
}
