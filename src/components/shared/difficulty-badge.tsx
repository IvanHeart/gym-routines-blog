import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types/entities'

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; className: string }> = {
  beginner: {
    label: 'Principiante',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  },
  intermediate: {
    label: 'Intermedio',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
  },
  advanced: {
    label: 'Avanzado',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/20',
  },
}

interface DifficultyBadgeProps {
  difficulty: Difficulty
  className?: string
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const config = DIFFICULTY_CONFIG[difficulty]
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className, className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {config.label}
    </Badge>
  )
}
