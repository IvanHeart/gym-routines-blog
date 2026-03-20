'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { shippingAddressSchema } from '@/lib/validations/shop'
import type { ActionResult } from '@/types/api'

export async function createAddressAction(
  _prev: null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const raw = {
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    address_line: formData.get('address_line'),
    city: formData.get('city'),
    state: formData.get('state'),
    postal_code: formData.get('postal_code'),
    country: formData.get('country') || 'México',
    notes: formData.get('notes') || null,
    is_default: formData.get('is_default') === 'true',
  }

  const parsed = shippingAddressSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join('.')
      errors[key] = [...(errors[key] ?? []), issue.message]
    })
    return { success: false, error: 'Revisa los campos.', errors }
  }

  // If setting as default, unset others
  if (parsed.data.is_default) {
    await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('shipping_addresses')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id')
    .single()

  if (error) return { success: false, error: 'Error al guardar la dirección.' }

  revalidatePath('/checkout')
  return { success: true, data: { id: data.id } }
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('shipping_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id)

  if (error) {
    if (error.code === '23503') {
      return { success: false, error: 'No se puede eliminar una dirección asociada a pedidos.' }
    }
    return { success: false, error: 'Error al eliminar la dirección.' }
  }

  revalidatePath('/checkout')
  return { success: true, data: undefined }
}
