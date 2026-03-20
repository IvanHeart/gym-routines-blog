'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/currency'
import { useCartContext } from '@/components/cart/cart-provider'
import type { CartItemWithProduct } from '@/hooks/use-cart'

export function CartItemRow({ item }: { item: CartItemWithProduct }) {
  const { updateQuantity, removeItem } = useCartContext()

  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0">
      {/* Image */}
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
            Sin img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col min-w-0">
        <Link
          href={`/tienda/${item.slug}`}
          className="text-sm font-medium truncate hover:text-primary"
        >
          {item.name}
        </Link>
        <span className="text-sm text-muted-foreground">{formatPrice(item.price)}</span>
        {!item.available && (
          <Badge variant="destructive" className="mt-1 w-fit text-[10px]">
            No disponible
          </Badge>
        )}

        {/* Quantity controls */}
        {item.available && (
          <div className="mt-1 flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Subtotal + remove */}
      <div className="flex flex-col items-end justify-between">
        <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(item.productId)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
