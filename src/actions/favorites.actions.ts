'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/api'

export async function toggleFavoriteAction(
  routineId: string,
  routineSlug: string
): Promise<ActionResult<{ isFavorited: boolean }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Debes iniciar sesión para guardar favoritos.' }

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('routine_id', routineId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id)
    revalidatePath(`/rutinas/${routineSlug}`)
    revalidatePath('/favoritos')
    return { success: true, data: { isFavorited: false } }
  }

  await supabase.from('favorites').insert({ routine_id: routineId, user_id: user.id })
  revalidatePath(`/rutinas/${routineSlug}`)
  revalidatePath('/favoritos')
  return { success: true, data: { isFavorited: true } }
}
