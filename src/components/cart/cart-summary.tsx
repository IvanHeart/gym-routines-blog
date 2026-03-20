'use client'

import { formatPrice } from '@/lib/utils/currency'
import { useCartContext } from '@/components/cart/cart-provider'

export function CartSummary() {
  const { total, count } = useCartContext()

  return (
    <div className="border-t border-border pt-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {count} producto{count !== 1 ? 's' : ''}
        </span>
        <span className="font-bold text-lg">{formatPrice(total)}</span>
      </div>
    </div>
  )
}
