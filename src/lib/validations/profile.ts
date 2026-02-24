import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().max(100, 'Máximo 100 caracteres').optional(),
  bio: z.string().max(500, 'La bio no puede superar 500 caracteres').optional(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
