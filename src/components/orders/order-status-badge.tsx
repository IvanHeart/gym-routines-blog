import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types/entities'

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pendiente', variant: 'outline' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  shipped: { label: 'Enviado', variant: 'secondary' },
  delivered: { label: 'Entregado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return <Badge variant={config.variant}>{config.label}</Badge>
}
