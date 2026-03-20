import { createClient } from '@/lib/supabase/server'
import type { ShippingAddress } from '@/types/entities'

export async function getUserAddresses(userId: string): Promise<ShippingAddress[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return (data ?? []) as ShippingAddress[]
}
