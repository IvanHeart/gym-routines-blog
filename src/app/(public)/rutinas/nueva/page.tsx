import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllCategories } from '@/dal/categories.dal'
import { RutinaForm } from '@/components/rutinas/rutina-form'
import { createRoutineAction } from '@/actions/routines.actions'

export const metadata: Metadata = {
  title: 'Nueva rutina',
}

export default async function NuevaRutinaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?returnUrl=/rutinas/nueva')

  const categories = await getAllCategories()

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Nueva rutina</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comparte tu entrenamiento con la comunidad
        </p>
      </div>
      <RutinaForm categories={categories} action={createRoutineAction} />
    </div>
  )
}
