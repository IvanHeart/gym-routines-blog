import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoutineForEdit } from '@/dal/dashboard.dal'
import { getAllCategories } from '@/dal/categories.dal'
import { RutinaForm } from '@/components/rutinas/rutina-form'
import { updateRoutineAction } from '@/actions/routines.actions'

export const metadata: Metadata = {
  title: 'Editar rutina',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarRutinaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?returnUrl=/dashboard/mis-rutinas/${id}/editar`)

  const [routine, categories] = await Promise.all([
    getRoutineForEdit(id, user.id),
    getAllCategories(),
  ])

  if (!routine) notFound()

  const defaultValues = {
    title: routine.title,
    excerpt: routine.excerpt ?? '',
    content: routine.content,
    difficulty: routine.difficulty as 'beginner' | 'intermediate' | 'advanced',
    duration_minutes: routine.duration_minutes,
    category_id: routine.category_id,
    published: routine.published,
    exercises: (routine.exercises ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((ex) => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        order_index: ex.order_index,
      })),
  }

  const updateAction = updateRoutineAction.bind(null, id)

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Editar rutina</h1>
        <p className="mt-1 text-sm text-muted-foreground">{routine.title}</p>
      </div>
      <RutinaForm
        categories={categories}
        action={updateAction}
        defaultValues={defaultValues}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
