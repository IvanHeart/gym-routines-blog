import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { getProfileByUsername, getAllUsernames } from '@/dal/profiles.dal'
import { getPublishedRoutines } from '@/dal/routines.dal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RutinaGrid } from '@/components/rutinas/rutina-grid'

export const revalidate = 60

interface Props {
  params: Promise<{ username: string }>
}

export async function generateStaticParams() {
  const usernames = await getAllUsernames()
  return usernames.map((username) => ({ username }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return { title: 'Usuario no encontrado' }
  return {
    title: `@${profile.username}`,
    description: profile.bio ?? `Perfil de ${profile.username} en GymRoutines`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  // Obtener rutinas del usuario — filtrar por author_id
  const supabaseModule = await import('@/lib/supabase/server')
  const supabase = await supabaseModule.createClient()
  const { data: authorRoutines } = await supabase
    .from('routines')
    .select(
      `
      id, title, slug, excerpt, cover_image_url, difficulty,
      duration_minutes, views, created_at, author_id, category_id, published, deleted_at,
      author:profiles!author_id(id, username, avatar_url),
      category:categories(id, name, slug, color)
    `
    )
    .eq('author_id', profile.id)
    .eq('published', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const routines = (authorRoutines ?? []) as Awaited<
    ReturnType<typeof getPublishedRoutines>
  >['routines']

  const initial = profile.username[0]?.toUpperCase() ?? 'U'

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      {/* Perfil header */}
      <header className="mb-10 flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-6">
        <Avatar className="h-24 w-24 sm:h-20 sm:w-20 shrink-0">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
          <AvatarFallback className="bg-primary/20 text-primary text-3xl sm:text-2xl">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="mt-4 sm:mt-0">
          <h1 className="text-2xl font-bold">{profile.full_name ?? `@${profile.username}`}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-sm text-foreground/80 max-w-md">{profile.bio}</p>}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground justify-center sm:justify-start">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Miembro desde{' '}
              {new Date(profile.created_at).toLocaleDateString('es', {
                year: 'numeric',
                month: 'long',
              })}
            </span>
            <span>·</span>
            <span>{routines.length} rutinas publicadas</span>
          </div>
        </div>
      </header>

      {/* Rutinas del usuario */}
      <section aria-label={`Rutinas de ${profile.username}`}>
        <h2 className="text-lg font-semibold mb-6">Rutinas</h2>
        <RutinaGrid routines={routines} />
      </section>
    </div>
  )
}
