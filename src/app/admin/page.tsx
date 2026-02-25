import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, MessageSquare, Tag, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Panel de control',
}

export default async function AdminPage() {
  const supabase = await createClient()

  const [routinesRes, commentsRes, categoriesRes, usersRes] = await Promise.all([
    supabase.from('routines').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('comments').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Rutinas', value: routinesRes.count ?? 0, icon: BookOpen, href: '/admin/rutinas' },
    {
      label: 'Comentarios',
      value: commentsRes.count ?? 0,
      icon: MessageSquare,
      href: '/admin/comentarios',
    },
    { label: 'Categorías', value: categoriesRes.count ?? 0, icon: Tag, href: '/admin/categorias' },
    { label: 'Usuarios', value: usersRes.count ?? 0, icon: Users, href: '#' },
  ]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestiona el contenido de GymRoutines</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-border/50 hover:border-primary/40 transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-2xl font-bold">{stat.value}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">{stat.label}</p>
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link href={stat.href}>Gestionar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Button asChild variant="outline">
          <Link href="/admin/categorias">
            <Tag className="mr-2 h-4 w-4" />
            Gestionar categorías
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/comentarios">
            <MessageSquare className="mr-2 h-4 w-4" />
            Moderar comentarios
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/rutinas">
            <BookOpen className="mr-2 h-4 w-4" />
            Gestionar rutinas
          </Link>
        </Button>
      </div>
    </div>
  )
}
