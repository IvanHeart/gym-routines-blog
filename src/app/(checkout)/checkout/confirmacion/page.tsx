import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { getOrderById } from '@/dal/orders.dal'
import { formatPrice } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Pedido Confirmado — GymRoutines',
}

interface Props {
  searchParams: Promise<{ order?: string }>
}

export default async function ConfirmacionPage({ searchParams }: Props) {
  const params = await searchParams
  if (!params.order) redirect('/tienda')

  const order = await getOrderById(params.order)
  if (!order) redirect('/tienda')

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">¡Compra realizada con éxito!</h1>
        <p className="text-muted-foreground mt-2">
          Tu pedido #{order.order_number} ha sido confirmado.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Número de pedido</span>
            <span className="font-bold">#{order.order_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Productos</span>
            <span>{order.items?.length ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-3">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg">{formatPrice(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/dashboard/mis-pedidos">Ver mis pedidos</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/tienda">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  )
}
