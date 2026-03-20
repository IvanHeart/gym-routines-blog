import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserAddresses } from '@/dal/addresses.dal'
import { CheckoutForm } from '@/components/checkout/checkout-form'

export const metadata: Metadata = {
  title: 'Checkout — GymRoutines',
}

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?returnUrl=/checkout')

  const addresses = await getUserAddresses(user.id)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">Completa tu compra</p>
      </div>
      <CheckoutForm addresses={addresses} />
    </div>
  )
}
