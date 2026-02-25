import { z } from 'zod'

export const exerciseSchema = z.object({
  id: z.string().optional(), // undefined para ejercicios nuevos
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  sets: z.coerce.number().int().min(1).max(99).nullable().optional(),
  reps: z.string().max(20).nullable().optional(),
  rest_seconds: z.coerce
    .number()
    .int()
    .min(0)
    .max(600, 'El descanso no puede superar 600 segundos')
    .nullable()
    .optional(),
  notes: z.string().max(300).nullable().optional(),
  order_index: z.number().int().min(0),
})

export const routineSchema = z.object({
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(100, 'El título no puede superar 100 caracteres'),
  excerpt: z.string().max(300, 'El resumen no puede superar 300 caracteres').optional(),
  content: z
    .string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(5000, 'La descripción no puede superar 5000 caracteres'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_minutes: z.coerce
    .number()
    .int()
    .min(5, 'Mínimo 5 minutos')
    .max(300, 'Máximo 300 minutos')
    .optional()
    .nullable(),
  category_id: z.string().uuid().optional().nullable(),
  published: z.boolean().default(false),
  exercises: z.array(exerciseSchema).min(1, 'Añade al menos un ejercicio').max(30),
})

export type RoutineFormValues = z.infer<typeof routineSchema>
export type ExerciseFormValues = z.infer<typeof exerciseSchema>
