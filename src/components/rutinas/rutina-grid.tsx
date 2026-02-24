import { RutinaCard } from '@/components/rutinas/rutina-card'
import type { RoutineWithRelations } from '@/dal/routines.dal'

interface RutinaGridProps {
  routines: RoutineWithRelations[]
}

export function RutinaGrid({ routines }: RutinaGridProps) {
  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold text-foreground">Sin rutinas por aquí</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Prueba con otro filtro o vuelve más tarde.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {routines.map((routine) => (
        <RutinaCard key={routine.id} routine={routine} />
      ))}
    </div>
  )
}
