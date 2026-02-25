'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2, ExternalLink, BookOpen, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import type { AdminRoutine } from '@/app/admin/rutinas/page'
import { deleteAnyRoutineAction } from '@/actions/admin.actions'
import { DifficultyBadge } from '@/components/shared/difficulty-badge'
import { CategoryBadge } from '@/components/shared/category-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AdminRoutinesPanelProps {
  routines: AdminRoutine[]
}

export function AdminRoutinesPanel({ routines: initialRoutines }: AdminRoutinesPanelProps) {
  const [routines, setRoutines] = useState(initialRoutines)
  const [deleteTarget, setDeleteTarget] = useState<AdminRoutine | null>(null)
  const [isPending, startTransition] = useTransition()

  function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id

    startTransition(async () => {
      const result = await deleteAnyRoutineAction(id)
      if (result.success) {
        setRoutines((prev) => prev.filter((r) => r.id !== id))
        toast.success('Rutina eliminada.')
      } else {
        toast.error(result.error ?? 'Error al eliminar.')
      }
      setDeleteTarget(null)
    })
  }

  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <BookOpen className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm">No hay rutinas publicadas.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="hidden md:table-cell">Autor</TableHead>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead className="hidden sm:table-cell">Dificultad</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Vistas</TableHead>
              <TableHead className="hidden lg:table-cell">Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Fecha</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {routines.map((routine) => (
              <TableRow key={routine.id}>
                {/* Title + link */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 max-w-[200px]">{routine.title}</span>
                    <Link
                      href={`/rutinas/${routine.slug}`}
                      target="_blank"
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Ver rutina"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </TableCell>

                {/* Author */}
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {routine.author?.username ?? '—'}
                </TableCell>

                {/* Category */}
                <TableCell className="hidden sm:table-cell">
                  {routine.category ? (
                    <CategoryBadge name={routine.category.name} color={routine.category.color} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Difficulty */}
                <TableCell className="hidden sm:table-cell">
                  <DifficultyBadge difficulty={routine.difficulty} />
                </TableCell>

                {/* Views */}
                <TableCell className="hidden lg:table-cell text-right text-sm text-muted-foreground">
                  {routine.views.toLocaleString()}
                </TableCell>

                {/* Published status */}
                <TableCell className="hidden lg:table-cell">
                  {routine.published ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      <Eye className="h-3 w-3" />
                      Publicada
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    >
                      <EyeOff className="h-3 w-3" />
                      Borrador
                    </Badge>
                  )}
                </TableCell>

                {/* Date */}
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                  {format(new Date(routine.created_at), 'd MMM yyyy', { locale: es })}
                </TableCell>

                {/* Delete */}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(routine)}
                    disabled={isPending}
                    aria-label="Eliminar rutina"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {routines.length} rutina{routines.length !== 1 ? 's' : ''}
      </p>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta rutina?</AlertDialogTitle>
            <AlertDialogDescription>
              La rutina <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong> será eliminada
              permanentemente junto con todos sus ejercicios y comentarios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
