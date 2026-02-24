'use client'

import { useOptimistic, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleFavoriteAction } from '@/actions/favorites.actions'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  routineId: string
  routineSlug: string
  initialIsFavorited: boolean
  initialCount: number
  isAuthenticated: boolean
}

export function FavoriteButton({
  routineId,
  routineSlug,
  initialIsFavorited,
  initialCount,
  isAuthenticated,
}: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticState, setOptimistic] = useOptimistic(
    { isFavorited: initialIsFavorited, count: initialCount },
    (_state, newState: { isFavorited: boolean; count: number }) => newState
  )

  function handleToggle() {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para guardar favoritos')
      return
    }

    const newIsFavorited = !optimisticState.isFavorited
    const newCount = optimisticState.count + (newIsFavorited ? 1 : -1)

    startTransition(async () => {
      setOptimistic({ isFavorited: newIsFavorited, count: newCount })
      const result = await toggleFavoriteAction(routineId, routineSlug)
      if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        'gap-2 transition-all',
        optimisticState.isFavorited &&
          'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
      )}
      aria-label={optimisticState.isFavorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      aria-pressed={optimisticState.isFavorited}
    >
      <Heart
        className={cn('h-4 w-4 transition-all', optimisticState.isFavorited && 'fill-rose-400')}
      />
      <span>{optimisticState.count}</span>
    </Button>
  )
}
