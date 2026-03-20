import type { Metadata } from 'next'
import { getAdminOrders } from '@/dal/orders.dal'
import { OrderList } from '@/components/orders/order-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { OrderStatus } from '@/types/entities'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Pedidos',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const status = params.status as OrderStatus | undefined

  const { orders, total } = await getAdminOrders({
    page,
    status: status || null,
    search: params.q || null,
  })

  const totalPages = Math.ceil(total / 20)
  const statuses: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'confirmed', label: 'Confirmados' },
    { value: 'shipped', label: 'Enviados' },
    { value: 'delivered', label: 'Entregados' },
    { value: 'cancelled', label: 'Cancelados' },
  ]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} pedidos</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Button
            key={s.value}
            asChild
            variant={status === s.value || (!status && s.value === '') ? 'default' : 'outline'}
            size="sm"
          >
            <Link href={s.value ? `/admin/pedidos?status=${s.value}` : '/admin/pedidos'}>
              {s.label}
            </Link>
          </Button>
        ))}
      </div>

      <OrderList orders={orders} basePath="/admin/pedidos" />

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} asChild variant={p === page ? 'default' : 'outline'} size="sm">
              <Link href={`/admin/pedidos?page=${p}${status ? `&status=${status}` : ''}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
