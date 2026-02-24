import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Clock, Calendar, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getRoutineBySlug, getAllPublishedSlugs } from '@/dal/routines.dal'
import { getRoutineComments } from '@/dal/comments.dal'
import { getUserFavorite, getRoutineFavoritesCount } from '@/dal/favorites.dal'
import { DifficultyBadge } from '@/components/shared/difficulty-badge'
import { CategoryBadge } from '@/components/shared/category-badge'
import { FavoriteButton } from '@/components/rutinas/favorite-button'
import { CommentSection } from '@/components/rutinas/comment-section'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { incrementRoutineViews } from '@/actions/views.actions'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const routine = await getRoutineBySlug(slug)
  if (!routine) return { title: 'Rutina no encontrada' }

  return {
    title: routine.title,
    description: routine.excerpt ?? `Rutina de gimnasio: ${routine.title}`,
    openGraph: {
      title: routine.title,
      description: routine.excerpt ?? undefined,
      images: routine.cover_image_url ? [routine.cover_image_url] : [],
      type: 'article',
    },
  }
}

export default async function RutinaDetailPage({ params }: Props) {
  const { slug } = await params
  const routine = await getRoutineBySlug(slug)
  if (!routine) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [comments, isFavorited, favoritesCount] = await Promise.all([
    getRoutineComments(routine.id),
    user ? getUserFavorite(routine.id, user.id) : Promise.resolve(false),
    getRoutineFavoritesCount(routine.id),
  ])

  // Obtener rol del usuario actual
  let currentUserRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    currentUserRole = profile?.role ?? null
  }

  // Incrementar vistas (fire and forget)
  void incrementRoutineViews(routine.id)

  const authorInitial = routine.author?.username?.[0]?.toUpperCase() ?? 'U'
  const exercises =
    (
      routine as {
        exercises?: {
          id: string
          name: string
          sets: number | null
          reps: string | null
          rest_seconds: number | null
          notes: string | null
          order_index: number
        }[]
      }
    ).exercises ?? []

  return (
    <article className="container mx-auto max-w-3xl px-4 py-10">
      {/* Back */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al listado
      </Link>

      {/* Imagen de portada */}
      {routine.cover_image_url && (
        <div className="relative mb-6 h-56 w-full overflow-hidden rounded-xl sm:h-72">
          <Image
            src={routine.cover_image_url}
            alt={routine.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Título y meta */}
      <header className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <DifficultyBadge difficulty={routine.difficulty} />
          {routine.category && (
            <CategoryBadge name={routine.category.name} color={routine.category.color} />
          )}
        </div>

        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{routine.title}</h1>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {/* Autor */}
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={routine.author?.avatar_url ?? undefined}
                alt={routine.author?.username}
              />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {authorInitial}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/perfil/${routine.author?.username ?? ''}`}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {routine.author?.username ?? 'Anónimo'}
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {routine.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {routine.duration_minutes} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {routine.views.toLocaleString('es')} vistas
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(routine.created_at).toLocaleDateString('es', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Favorito */}
        <div className="mt-4">
          <FavoriteButton
            routineId={routine.id}
            routineSlug={routine.slug}
            initialIsFavorited={isFavorited}
            initialCount={favoritesCount}
            isAuthenticated={!!user}
          />
        </div>
      </header>

      <Separator className="mb-6" />

      {/* Extracto */}
      {routine.excerpt && (
        <p className="mb-6 text-base text-muted-foreground leading-relaxed italic border-l-2 border-primary/40 pl-4">
          {routine.excerpt}
        </p>
      )}

      {/* Descripción */}
      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none mb-8">
        {routine.content
          .split('\n')
          .map((paragraph, i) => (paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />))}
      </div>

      {/* Tabla de ejercicios */}
      {exercises.length > 0 && (
        <section className="mb-10" aria-label="Ejercicios">
          <h2 className="text-lg font-semibold mb-4">Ejercicios ({exercises.length})</h2>

          {/* Desktop */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Ejercicio</TableHead>
                  <TableHead className="text-center">Series</TableHead>
                  <TableHead className="text-center">Reps</TableHead>
                  <TableHead className="text-center">Descanso</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exercises.map((ex, i) => (
                  <TableRow key={ex.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{ex.name}</TableCell>
                    <TableCell className="text-center">{ex.sets ?? '—'}</TableCell>
                    <TableCell className="text-center">{ex.reps ?? '—'}</TableCell>
                    <TableCell className="text-center">
                      {ex.rest_seconds ? `${ex.rest_seconds}s` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ex.notes ?? ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards apiladas */}
          <ul className="md:hidden space-y-3" role="list">
            {exercises.map((ex, i) => (
              <li key={ex.id} className="rounded-lg border border-border/50 bg-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium">{ex.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">#{i + 1}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {ex.sets && <span>{ex.sets} series</span>}
                  {ex.reps && <span>{ex.reps} reps</span>}
                  {ex.rest_seconds && <span>{ex.rest_seconds}s descanso</span>}
                </div>
                {ex.notes && <p className="mt-2 text-xs text-muted-foreground">{ex.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Separator className="mb-8" />

      {/* Comentarios */}
      <CommentSection
        routineId={routine.id}
        routineSlug={routine.slug}
        comments={comments}
        currentUserId={user?.id ?? null}
        currentUserRole={currentUserRole}
      />
    </article>
  )
}
