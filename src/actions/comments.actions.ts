'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/api'

const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(1000, 'El comentario no puede superar 1000 caracteres')
    .trim(),
})

export async function createCommentAction(
  routineId: string,
  routineSlug: string,
  _prev: null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Debes iniciar sesión para comentar.' }

  const parsed = commentSchema.safeParse({ content: formData.get('content') })
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Comentario inválido.',
    }
  }

  const { error } = await supabase.from('comments').insert({
    routine_id: routineId,
    author_id: user.id,
    content: parsed.data.content,
  })

  if (error) return { success: false, error: 'Error al publicar el comentario.' }

  revalidatePath(`/rutinas/${routineSlug}`)
  return { success: true, data: undefined }
}

export async function deleteCommentAction(
  commentId: string,
  routineSlug: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado.' }

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (!comment) return { success: false, error: 'Comentario no encontrado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (comment.author_id !== user.id && profile?.role !== 'admin') {
    return { success: false, error: 'No tienes permiso.' }
  }

  await supabase
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  revalidatePath(`/rutinas/${routineSlug}`)
  return { success: true, data: undefined }
}
