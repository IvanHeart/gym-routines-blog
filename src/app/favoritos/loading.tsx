import { RutinaGridSkeleton } from '@/components/rutinas/rutina-card-skeleton'

export default function FavoritosLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-40 rounded bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded bg-muted animate-pulse" />
      </div>
      <RutinaGridSkeleton count={6} />
    </div>
  )
}
