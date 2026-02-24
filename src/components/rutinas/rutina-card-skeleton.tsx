import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

export function RutinaCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <Skeleton className="h-44 w-full rounded-none" />
      <CardContent className="px-4 pt-3 pb-2">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-1.5" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-5/6" />
      </CardContent>
      <CardFooter className="px-4 pb-3 pt-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-8" />
        </div>
      </CardFooter>
    </Card>
  )
}

export function RutinaGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <RutinaCardSkeleton key={i} />
      ))}
    </div>
  )
}
