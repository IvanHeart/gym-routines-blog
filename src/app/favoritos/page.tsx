import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getMyFavoriteRoutines } from '@/dal/dashboard.dal'
import { RutinaGrid } from '@/components/rutinas/rutina-grid'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mis favoritos',
}

export default async function FavoritosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?returnUrl=/favoritos')

  const routines = await getMyFavoriteRoutines(user.id)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Favoritos</h1>
        <p className="text-sm text-muted-foreground mt-1">Rutinas que has guardado</p>
      </div>

      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border">
          <p className="text-sm font-medium">Sin favoritos todavía</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Explora rutinas y pulsa el corazón para guardarlas aquí
          </p>
          <Button asChild size="sm" variant="outline" className="mt-4">
            <Link href="/">Explorar rutinas</Link>
          </Button>
        </div>
      ) : (
        <RutinaGrid routines={routines} />
      )}
    </div>
  )
}
