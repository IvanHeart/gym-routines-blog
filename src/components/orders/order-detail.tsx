import { formatPrice } from '@/lib/utils/currency'
import { OrderStatusBadge } from './order-status-badge'
import { OrderStatusSelect } from './order-status-select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Order } from '@/types/entities'

interface Props {
  order: Order
  isAdmin?: boolean
}

export function OrderDetail({ order, isAdmin = false }: Props) {
  const address = order.shipping_address

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Admin: status changer */}
      {isAdmin && <OrderStatusSelect orderId={order.id} currentStatus={order.status} />}

      {/* Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer & Date */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {order.user && (
              <p>
                <span className="text-muted-foreground">Cliente: </span>
                {order.user.full_name ?? order.user.username}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Fecha: </span>
              {new Date(order.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {order.notes && (
              <p>
                <span className="text-muted-foreground">Notas: </span>
                {order.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Shipping address */}
        {address && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Dirección de envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{address.full_name}</p>
              <p className="text-muted-foreground">Tel: {address.phone}</p>
              <p className="text-muted-foreground">{address.address_line}</p>
              <p className="text-muted-foreground">
                {address.city}, {address.state}, CP {address.postal_code}
              </p>
              {address.notes && (
                <p className="text-muted-foreground italic">&ldquo;{address.notes}&rdquo;</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(item.unit_price * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatPrice(order.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
