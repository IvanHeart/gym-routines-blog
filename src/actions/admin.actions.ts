'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/api'

const categorySchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Formato hex inválido (ej: #FF5733)'),
})

async function assertAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user.id : null
}

export async function createCategoryAction(
  _prev: null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const adminId = await assertAdmin()
  if (!adminId) return { success: false, error: 'No autorizado.' }

  const supabase = await createClient()
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    color: formData.get('color'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
    }
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505')
      return { success: false, error: 'Ya existe una categoría con ese slug.' }
    return { success: false, error: 'Error al crear la categoría.' }
  }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
  return { success: true, data: { id: data.id } }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  const adminId = await assertAdmin()
  if (!adminId) return { success: false, error: 'No autorizado.' }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', categoryId)

  if (error) return { success: false, error: 'Error al eliminar la categoría.' }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
  return { success: true, data: undefined }
}

export async function deleteAnyCommentAction(
  commentId: string,
  routineSlug: string
): Promise<ActionResult> {
  const adminId = await assertAdmin()
  if (!adminId) return { success: false, error: 'No autorizado.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) return { success: false, error: 'Error al eliminar el comentario.' }

  if (routineSlug) revalidatePath(`/rutinas/${routineSlug}`)
  revalidatePath('/admin/comentarios')
  return { success: true, data: undefined }
}

export async function deleteAnyRoutineAction(routineId: string): Promise<ActionResult> {
  const adminId = await assertAdmin()
  if (!adminId) return { success: false, error: 'No autorizado.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('routines')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', routineId)

  if (error) return { success: false, error: 'Error al eliminar la rutina.' }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true, data: undefined }
}
