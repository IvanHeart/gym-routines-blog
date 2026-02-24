'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/validations/profile'
import { validateMimeFromBuffer } from '@/lib/utils/image'
import sharp from 'sharp'
import type { ActionResult } from '@/types/api'

export async function updateProfileAction(_prev: null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'No autenticado.' }

  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name') || undefined,
    bio: formData.get('bio') || undefined,
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
    }
  }

  // Upload de avatar (opcional)
  let avatar_url: string | undefined
  const avatarFile = formData.get('avatar') as File | null
  if (avatarFile && avatarFile.size > 0) {
    const buffer = Buffer.from(await avatarFile.arrayBuffer())
    const isSafe = await validateMimeFromBuffer(buffer)
    if (!isSafe) return { success: false, error: 'Formato de imagen no permitido.' }

    // Redimensionar a 200x200 cuadrado
    const processed = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer()

    const fileName = `${user.id}/avatar.webp`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, processed, { contentType: 'image/webp', upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      avatar_url = `${urlData.publicUrl}?t=${Date.now()}`
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name ?? null,
      bio: parsed.data.bio ?? null,
      ...(avatar_url ? { avatar_url } : {}),
    })
    .eq('id', user.id)

  if (error) return { success: false, error: 'Error al actualizar el perfil.' }

  revalidatePath('/perfil/editar')
  return { success: true, data: undefined }
}
