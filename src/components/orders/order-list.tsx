import Link from 'next/link'
import { formatPrice } from '@/lib/utils/currency'
import { OrderStatusBadge } from './order-status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Order } from '@/types/entities'

interface Props {
  orders: Order[]
  basePath: string // '/dashboard/mis-pedidos' or '/admin/pedidos'
}

export function OrderList({ orders, basePath }: Props) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No hay pedidos.</p>
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Card key={order.id} className="border-border/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">#{order.order_number}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {' · '}
                {order.items?.length ?? 0} producto{(order.items?.length ?? 0) !== 1 ? 's' : ''}
              </p>
              {order.user && (
                <p className="text-xs text-muted-foreground">
                  Cliente: {order.user.full_name ?? order.user.username}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">{formatPrice(order.total)}</span>
              <Button asChild variant="outline" size="sm">
                <Link href={`${basePath}/${order.id}`}>Ver</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
