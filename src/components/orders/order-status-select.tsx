'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateOrderStatusAction } from '@/actions/order.actions'
import type { OrderStatus } from '@/types/entities'
import { useState } from 'react'

const NEXT_STATES: Record<string, { value: OrderStatus; label: string }[]> = {
  confirmed: [
    { value: 'shipped', label: 'Marcar como enviado' },
    { value: 'cancelled', label: 'Cancelar' },
  ],
  shipped: [
    { value: 'delivered', label: 'Marcar como entregado' },
    { value: 'cancelled', label: 'Cancelar' },
  ],
}

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string>('')
  const options = NEXT_STATES[currentStatus]

  if (!options || options.length === 0) return null

  function handleUpdate() {
    if (!selected) return
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, selected as OrderStatus)
      if (result.success) {
        toast.success('Estado actualizado')
        setSelected('')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Cambiar estado..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleUpdate} disabled={!selected || isPending}>
        {isPending ? 'Actualizando...' : 'Aplicar'}
      </Button>
    </div>
  )
}
