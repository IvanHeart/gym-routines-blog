'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createOrderAction } from '@/actions/order.actions'
import { AddressForm } from './address-form'
import { CheckoutOrderSummary } from './order-summary'
import type { ShippingAddress } from '@/types/entities'

interface Props {
  addresses: ShippingAddress[]
}

export function CheckoutForm({ addresses }: Props) {
  const [selectedAddress, setSelectedAddress] = useState<string>(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? ''
  )
  const [showNewAddress, setShowNewAddress] = useState(addresses.length === 0)
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAddressCreated(id: string) {
    setSelectedAddress(id)
    setShowNewAddress(false)
  }

  function handleSubmit() {
    if (!selectedAddress) {
      toast.error('Selecciona una dirección de envío')
      return
    }

    const fd = new FormData()
    fd.set('shipping_address_id', selectedAddress)
    fd.set('notes', notes)

    startTransition(async () => {
      const result = await createOrderAction(null, fd)
      if (result.success) {
        toast.success('Pedido creado exitosamente')
        router.push(`/checkout/confirmacion?order=${result.data.orderId}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left: Address + Notes */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Dirección de envío</h2>

          {addresses.length > 0 && !showNewAddress && (
            <Select value={selectedAddress} onValueChange={setSelectedAddress}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar dirección" />
              </SelectTrigger>
              <SelectContent>
                {addresses.map((addr) => (
                  <SelectItem key={addr.id} value={addr.id}>
                    {addr.full_name} — {addr.address_line}, {addr.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!showNewAddress && (
            <Button variant="outline" size="sm" onClick={() => setShowNewAddress(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Nueva dirección
            </Button>
          )}

          {showNewAddress && (
            <div className="rounded-lg border border-border p-4">
              <AddressForm onCreated={handleAddressCreated} />
              {addresses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowNewAddress(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Instrucciones especiales para tu pedido..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Right: Summary + Pay */}
      <div className="space-y-4">
        <CheckoutOrderSummary />

        <Button
          onClick={handleSubmit}
          disabled={isPending || !selectedAddress}
          className="w-full"
          size="lg"
        >
          {isPending ? 'Procesando...' : 'Confirmar compra'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Pago simulado — no se realizará ningún cargo real.
        </p>
      </div>
    </div>
  )
}
