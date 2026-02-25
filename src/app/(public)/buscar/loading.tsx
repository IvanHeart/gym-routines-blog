import { RutinaGridSkeleton } from '@/components/rutinas/rutina-card-skeleton'

export default function BuscarLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <div className="h-8 w-40 rounded bg-muted animate-pulse mb-4" />
        <div className="flex gap-3">
          <div className="h-10 w-64 rounded bg-muted animate-pulse" />
          <div className="h-10 w-36 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <RutinaGridSkeleton count={12} />
    </div>
  )
}
