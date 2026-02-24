import { RutinaGridSkeleton } from '@/components/rutinas/rutina-card-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="border-b border-border/40 py-16 md:py-20">
        <div className="container mx-auto px-4 text-center space-y-4">
          <Skeleton className="mx-auto h-12 w-96 max-w-full" />
          <Skeleton className="mx-auto h-5 w-[480px] max-w-full" />
          <Skeleton className="mx-auto h-5 w-72 max-w-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container mx-auto px-4 py-10">
        {/* Filters skeleton */}
        <div className="mb-8 flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>

        <RutinaGridSkeleton count={9} />
      </div>
    </>
  )
}
