import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMyRoutines, getDashboardStats } from '@/dal/dashboard.dal'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { MyRoutinesTable } from '@/components/dashboard/my-routines-table'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mis rutinas',
}

export default async function MisRutinasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?returnUrl=/dashboard/mis-rutinas')

  const [routines, stats] = await Promise.all([getMyRoutines(user.id), getDashboardStats(user.id)])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis rutinas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tus rutinas publicadas y borradores
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/rutinas/nueva">
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva rutina
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <StatsCards stats={stats} />
        <MyRoutinesTable routines={routines} />
      </div>
    </div>
  )
}
