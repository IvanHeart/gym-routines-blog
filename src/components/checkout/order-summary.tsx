'use client'

import { formatPrice } from '@/lib/utils/currency'
import { useCartContext } from '@/components/cart/cart-provider'

export function CheckoutOrderSummary() {
  const { items, total } = useCartContext()

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <h3 className="text-sm font-semibold">Resumen del pedido</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {item.name} x{item.quantity}
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-3 flex justify-between">
        <span className="font-semibold">Total</span>
        <span className="font-bold text-lg">{formatPrice(total)}</span>
      </div>
    </div>
  )
}
