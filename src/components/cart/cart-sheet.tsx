'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCartContext } from '@/components/cart/cart-provider'
import { useSession } from '@/components/providers/session-provider'
import { CartIcon } from './cart-icon'
import { CartItemRow } from './cart-item-row'
import { CartSummary } from './cart-summary'

export function CartSheet() {
  const [open, setOpen] = useState(false)
  const { items, count } = useCartContext()
  const { user } = useSession()
  const hasUnavailable = items.some((i) => !i.available)

  return (
    <>
      <CartIcon onClick={() => setOpen(true)} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({count})
          </SheetTitle>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Tu carrito está vacío</p>
              <Button asChild variant="outline" onClick={() => setOpen(false)}>
                <Link href="/tienda">Ir a la tienda</Link>
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                {items.map((item) => (
                  <CartItemRow key={item.productId} item={item} />
                ))}
              </ScrollArea>

              <div className="mt-auto space-y-3">
                <CartSummary />
                {user ? (
                  <Button
                    asChild
                    className="w-full"
                    disabled={hasUnavailable}
                    onClick={() => setOpen(false)}
                  >
                    <Link href="/checkout">Ir al checkout</Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full" onClick={() => setOpen(false)}>
                    <Link href="/login?returnUrl=/checkout">Iniciar sesión para comprar</Link>
                  </Button>
                )}
                {hasUnavailable && (
                  <p className="text-xs text-destructive text-center">
                    Elimina los productos no disponibles para continuar.
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
