'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { routineSchema } from '@/lib/validations/routine'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { validateMimeFromBuffer, processRoutineImage } from '@/lib/utils/image'
import type { ActionResult } from '@/types/api'

// ─── Crear rutina ────────────────────────────────────────────────────────────

export async function createRoutineAction(
  _prev: null,
  formData: FormData
): Promise<ActionResult<{ slug: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Debes iniciar sesión para crear una rutina.' }

  // Parsear ejercicios del FormData (JSON string)
  let exercisesRaw: unknown
  try {
    exercisesRaw = JSON.parse(formData.get('exercises') as string)
  } catch {
    return { success: false, error: 'Datos de ejercicios inválidos.' }
  }

  const raw = {
    title: formData.get('title'),
    excerpt: formData.get('excerpt') || undefined,
    content: formData.get('content'),
    difficulty: formData.get('difficulty'),
    duration_minutes: formData.get('duration_minutes') || null,
    category_id: formData.get('category_id') || null,
    published: formData.get('published') === 'true',
    exercises: exercisesRaw,
  }

  const parsed = routineSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join('.')
      errors[key] = [...(errors[key] ?? []), issue.message]
    })
    return { success: false, error: 'Revisa los campos del formulario.', errors }
  }

  const { exercises, ...routineData } = parsed.data

  // Upload de imagen (opcional)
  let cover_image_url: string | null = null
  const imageFile = formData.get('cover_image') as File | null
  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const isSafe = await validateMimeFromBuffer(buffer)
    if (!isSafe) return { success: false, error: 'Formato de imagen no permitido.' }

    const processed = await processRoutineImage(buffer)
    const fileName = `${user.id}/${Date.now()}.webp`

    const { error: uploadError } = await supabase.storage
      .from('routine-images')
      .upload(fileName, processed, { contentType: 'image/webp', upsert: false })

    if (uploadError) return { success: false, error: 'Error al subir la imagen.' }

    const { data: urlData } = supabase.storage.from('routine-images').getPublicUrl(fileName)
    cover_image_url = urlData.publicUrl
  }

  // Generar slug único
  const slug = await generateUniqueSlug(routineData.title, supabase)

  // Insertar rutina
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .insert({
      ...routineData,
      slug,
      cover_image_url,
      author_id: user.id,
    })
    .select('id, slug')
    .single()

  if (routineError || !routine) {
    return { success: false, error: 'Error al guardar la rutina. Inténtalo de nuevo.' }
  }

  // Insertar ejercicios
  if (exercises.length > 0) {
    const exercisesWithRoutineId = exercises.map((ex, i) => ({
      routine_id: routine.id,
      name: ex.name,
      sets: ex.sets ?? null,
      reps: ex.reps ?? null,
      rest_seconds: ex.rest_seconds ?? null,
      notes: ex.notes ?? null,
      order_index: i,
    }))

    const { error: exError } = await supabase.from('exercises').insert(exercisesWithRoutineId)
    if (exError) {
      // Rollback: eliminar la rutina si falla la inserción de ejercicios
      await supabase.from('routines').delete().eq('id', routine.id)
      return { success: false, error: 'Error al guardar los ejercicios.' }
    }
  }

  revalidatePath('/')
  revalidatePath('/dashboard/mis-rutinas')
  redirect(`/rutinas/${routine.slug}`)
}

// ─── Actualizar rutina ───────────────────────────────────────────────────────

export async function updateRoutineAction(
  routineId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ slug: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado.' }

  // Verificar IDOR: solo el autor puede editar
  const { data: existing } = await supabase
    .from('routines')
    .select('id, slug, author_id, cover_image_url')
    .eq('id', routineId)
    .single()

  if (!existing) return { success: false, error: 'Rutina no encontrada.' }
  if (existing.author_id !== user.id)
    return { success: false, error: 'No tienes permiso para editar esta rutina.' }

  let exercisesRaw: unknown
  try {
    exercisesRaw = JSON.parse(formData.get('exercises') as string)
  } catch {
    return { success: false, error: 'Datos de ejercicios inválidos.' }
  }

  const raw = {
    title: formData.get('title'),
    excerpt: formData.get('excerpt') || undefined,
    content: formData.get('content'),
    difficulty: formData.get('difficulty'),
    duration_minutes: formData.get('duration_minutes') || null,
    category_id: formData.get('category_id') || null,
    published: formData.get('published') === 'true',
    exercises: exercisesRaw,
  }

  const parsed = routineSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join('.')
      errors[key] = [...(errors[key] ?? []), issue.message]
    })
    return { success: false, error: 'Revisa los campos del formulario.', errors }
  }

  const { exercises, ...routineData } = parsed.data

  // Upload nueva imagen (opcional)
  let cover_image_url = existing.cover_image_url
  const imageFile = formData.get('cover_image') as File | null
  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const isSafe = await validateMimeFromBuffer(buffer)
    if (!isSafe) return { success: false, error: 'Formato de imagen no permitido.' }

    const processed = await processRoutineImage(buffer)
    const fileName = `${user.id}/${Date.now()}.webp`

    const { error: uploadError } = await supabase.storage
      .from('routine-images')
      .upload(fileName, processed, { contentType: 'image/webp', upsert: false })

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('routine-images').getPublicUrl(fileName)
      cover_image_url = urlData.publicUrl
    }
  }

  const { error: updateError } = await supabase
    .from('routines')
    .update({ ...routineData, cover_image_url })
    .eq('id', routineId)

  if (updateError) return { success: false, error: 'Error al actualizar la rutina.' }

  // Reemplazar ejercicios: borrar y reinsertar
  await supabase.from('exercises').delete().eq('routine_id', routineId)

  if (exercises.length > 0) {
    await supabase.from('exercises').insert(
      exercises.map((ex, i) => ({
        routine_id: routineId,
        name: ex.name,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        rest_seconds: ex.rest_seconds ?? null,
        notes: ex.notes ?? null,
        order_index: i,
      }))
    )
  }

  revalidatePath('/')
  revalidatePath(`/rutinas/${existing.slug}`)
  revalidatePath('/dashboard/mis-rutinas')
  redirect(`/rutinas/${existing.slug}`)
}

// ─── Eliminar rutina (soft delete) ──────────────────────────────────────────

export async function deleteRoutineAction(routineId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado.' }

  const { data: existing } = await supabase
    .from('routines')
    .select('author_id, slug')
    .eq('id', routineId)
    .single()

  if (!existing) return { success: false, error: 'Rutina no encontrada.' }

  // Admins también pueden eliminar — verificar rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAuthor = existing.author_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isAuthor && !isAdmin)
    return { success: false, error: 'No tienes permiso para eliminar esta rutina.' }

  const { error } = await supabase
    .from('routines')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', routineId)

  if (error) return { success: false, error: 'Error al eliminar la rutina.' }

  revalidatePath('/')
  revalidatePath('/dashboard/mis-rutinas')
  return { success: true, data: undefined }
}
