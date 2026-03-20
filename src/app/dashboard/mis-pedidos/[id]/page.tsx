import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOrderById } from '@/dal/orders.dal'
import { cancelOrderAction } from '@/actions/order.actions'
import { OrderDetail } from '@/components/orders/order-detail'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Detalle de Pedido — GymRoutines',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function MiPedidoDetailPage({ params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const order = await getOrderById(id)
  if (!order || order.user_id !== user.id) notFound()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/dashboard/mis-pedidos"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis pedidos
      </Link>

      <OrderDetail order={order} />

      {order.status === 'confirmed' && (
        <form
          action={async () => {
            'use server'
            await cancelOrderAction(order.id)
          }}
          className="mt-6"
        >
          <Button variant="destructive" size="sm" type="submit">
            Cancelar pedido
          </Button>
        </form>
      )}
    </div>
  )
}
