'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createAddressAction } from '@/actions/address.actions'
import { shippingAddressSchema, type ShippingAddressFormValues } from '@/lib/validations/shop'

interface Props {
  onCreated?: (id: string) => void
}

export function AddressForm({ onCreated }: Props) {
  const [isPending, startTransition] = useTransition()
  const form = useForm<ShippingAddressFormValues>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      address_line: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'México',
      notes: '',
      is_default: false,
    },
  })

  function onSubmit(values: ShippingAddressFormValues) {
    const fd = new FormData()
    Object.entries(values).forEach(([key, val]) => {
      if (val !== null && val !== undefined) fd.set(key, String(val))
    })

    startTransition(async () => {
      const result = await createAddressAction(null, fd)
      if (result.success) {
        toast.success('Dirección guardada')
        form.reset()
        onCreated?.(result.data.id)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="+52 555 123 4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address_line"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Calle y número" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <FormControl>
                <Input placeholder="Ciudad de México" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <FormControl>
                <Input placeholder="CDMX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código postal</FormLabel>
              <FormControl>
                <Input placeholder="06600" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Entregar por la tarde" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sm:col-span-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar dirección'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
