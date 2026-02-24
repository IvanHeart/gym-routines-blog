'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Trash2, MoreHorizontal, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { DifficultyBadge } from '@/components/shared/difficulty-badge'
import { deleteRoutineAction } from '@/actions/routines.actions'
import type { MyRoutine } from '@/dal/dashboard.dal'

interface MyRoutinesTableProps {
  routines: MyRoutine[]
}

export function MyRoutinesTable({ routines }: MyRoutinesTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<MyRoutine | null>(null)

  function handleDelete(routine: MyRoutine) {
    startTransition(async () => {
      const result = await deleteRoutineAction(routine.id)
      if (result.success) {
        toast.success('Rutina eliminada')
        setDeleteTarget(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm font-medium">Todavía no tienes rutinas</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Crea tu primera rutina y compártela con la comunidad
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/rutinas/nueva">Crear rutina</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rutina</TableHead>
              <TableHead>Dificultad</TableHead>
              <TableHead className="text-center">
                <Eye className="h-3.5 w-3.5 mx-auto" />
              </TableHead>
              <TableHead className="text-center">
                <Heart className="h-3.5 w-3.5 mx-auto" />
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {routines.map((routine) => (
              <TableRow key={routine.id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/rutinas/${routine.slug}`}
                      className="font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {routine.title}
                    </Link>
                    {routine.category && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {routine.category.name}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DifficultyBadge difficulty={routine.difficulty} />
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {routine.views.toLocaleString('es')}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {routine.favorites_count}
                </TableCell>
                <TableCell>
                  <Badge variant={routine.published ? 'default' : 'secondary'} className="text-xs">
                    {routine.published ? 'Publicada' : 'Borrador'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/rutinas/${routine.slug}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/mis-rutinas/${routine.id}/editar`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(routine)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rutina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción moverá &ldquo;{deleteTarget?.title}&rdquo; a la papelera. No será visible
              para otros usuarios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
