import Link from 'next/link'
import Image from 'next/image'
import { Clock, Eye } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DifficultyBadge } from '@/components/shared/difficulty-badge'
import { CategoryBadge } from '@/components/shared/category-badge'
import { cn } from '@/lib/utils'
import type { RoutineWithRelations } from '@/dal/routines.dal'

interface RutinaCardProps {
  routine: RoutineWithRelations
  className?: string
}

export function RutinaCard({ routine, className }: RutinaCardProps) {
  const authorInitial = routine.author?.username?.[0]?.toUpperCase() ?? 'U'

  return (
    <Link
      href={`/rutinas/${routine.slug}`}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
    >
      <Card
        className={cn(
          'overflow-hidden border-border/50 bg-card transition-all duration-300',
          'group-hover:border-primary/40 group-hover:shadow-[0_0_20px_-5px_var(--color-primary)]',
          'group-focus-visible:border-primary/60',
          className
        )}
      >
        {/* Imagen de portada */}
        <div className="relative h-44 w-full overflow-hidden bg-muted">
          {routine.cover_image_url ? (
            <Image
              src={routine.cover_image_url}
              alt={routine.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-4xl font-black text-primary/20 select-none">GR</span>
            </div>
          )}
          {/* Overlay degradado */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
          {/* Badges superpuestos */}
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
            <DifficultyBadge difficulty={routine.difficulty} />
            {routine.category && (
              <CategoryBadge name={routine.category.name} color={routine.category.color} />
            )}
          </div>
        </div>

        <CardContent className="px-4 pt-3 pb-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {routine.title}
          </h3>
          {routine.excerpt && (
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {routine.excerpt}
            </p>
          )}
        </CardContent>

        <CardFooter className="px-4 pb-3 pt-1 flex items-center justify-between">
          {/* Autor */}
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage
                src={routine.author?.avatar_url ?? undefined}
                alt={routine.author?.username ?? 'Usuario'}
              />
              <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                {authorInitial}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {routine.author?.username ?? 'Anónimo'}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {routine.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {routine.duration_minutes}min
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" aria-hidden="true" />
              {routine.views.toLocaleString('es')}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
