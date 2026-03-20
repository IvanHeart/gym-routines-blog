'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkoutSchema } from '@/lib/validations/shop'
import type { ActionResult } from '@/types/api'
import type { OrderStatus } from '@/types/entities'

export async function createOrderAction(
  _prev: null,
  formData: FormData
): Promise<ActionResult<{ orderId: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const parsed = checkoutSchema.safeParse({
    shipping_address_id: formData.get('shipping_address_id'),
    notes: formData.get('notes') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  // Call the atomic RPC function
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.rpc('create_order', {
    p_user_id: user.id,
    p_shipping_address_id: parsed.data.shipping_address_id,
    p_notes: parsed.data.notes ?? undefined,
  })

  if (error) {
    const msg = error.message || 'Error al crear el pedido.'
    return { success: false, error: msg }
  }

  revalidatePath('/dashboard/mis-pedidos')
  revalidatePath('/tienda')
  return { success: true, data: { orderId: data as string } }
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.rpc('cancel_order', {
    p_order_id: orderId,
    p_user_id: user.id,
  })

  if (error) {
    return { success: false, error: error.message || 'Error al cancelar el pedido.' }
  }

  revalidatePath('/dashboard/mis-pedidos')
  revalidatePath('/admin/pedidos')
  revalidatePath('/tienda')
  return { success: true, data: undefined }
}

/** Admin: update order status (advance only) */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { success: false, error: 'No autorizado.' }

  // If cancelling, use the RPC
  if (newStatus === 'cancelled') {
    return cancelOrderAction(orderId)
  }

  // Validate state transition
  const validTransitions: Record<string, string[]> = {
    confirmed: ['shipped'],
    shipped: ['delivered'],
  }

  const adminClient = createAdminClient()
  const { data: order } = await adminClient
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order) return { success: false, error: 'Pedido no encontrado.' }

  const allowed = validTransitions[order.status] ?? []
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `No se puede cambiar de "${order.status}" a "${newStatus}".`,
    }
  }

  const { error } = await adminClient
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { success: false, error: 'Error al actualizar el estado.' }

  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${orderId}`)
  return { success: true, data: undefined }
}
