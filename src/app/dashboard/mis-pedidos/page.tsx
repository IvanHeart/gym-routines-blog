import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyOrders } from '@/dal/orders.dal'
import { OrderList } from '@/components/orders/order-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mis Pedidos — GymRoutines',
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function MisPedidosPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?returnUrl=/dashboard/mis-pedidos')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const { orders, total } = await getMyOrders({ userId: user.id, page })
  const totalPages = Math.ceil(total / 10)

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mis pedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} pedido{total !== 1 ? 's' : ''}
        </p>
      </div>

      <OrderList orders={orders} basePath="/dashboard/mis-pedidos" />

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} asChild variant={p === page ? 'default' : 'outline'} size="sm">
              <Link href={`/dashboard/mis-pedidos?page=${p}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
