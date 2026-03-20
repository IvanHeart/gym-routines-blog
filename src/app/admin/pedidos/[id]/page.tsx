import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAdminOrderById } from '@/dal/orders.dal'
import { OrderDetail } from '@/components/orders/order-detail'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Detalle de Pedido',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminPedidoDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getAdminOrderById(id)
  if (!order) notFound()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/admin/pedidos"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pedidos
      </Link>
      <OrderDetail order={order} isAdmin />
    </div>
  )
}
