'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2, ExternalLink, MessageSquare } from 'lucide-react'
import type { AdminComment } from '@/app/admin/comentarios/page'
import { deleteAnyCommentAction } from '@/actions/admin.actions'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface AdminCommentsPanelProps {
  comments: AdminComment[]
}

export function AdminCommentsPanel({ comments: initialComments }: AdminCommentsPanelProps) {
  const [comments, setComments] = useState(initialComments)
  const [deleteTarget, setDeleteTarget] = useState<AdminComment | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(comment: AdminComment) {
    setDeleteTarget(comment)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    const slug = deleteTarget.routine?.slug ?? ''

    startTransition(async () => {
      const result = await deleteAnyCommentAction(id, slug)
      if (result.success) {
        setComments((prev) => prev.filter((c) => c.id !== id))
        toast.success('Comentario eliminado.')
      } else {
        toast.error(result.error ?? 'Error al eliminar.')
      }
      setDeleteTarget(null)
    })
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <MessageSquare className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm">No hay comentarios para moderar.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg border bg-card p-4 transition-colors hover:border-muted-foreground/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* Metadata */}
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {comment.author?.username ?? 'Usuario eliminado'}
                  </span>
                  <span>·</span>
                  <span>
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                  {comment.routine && (
                    <>
                      <span>·</span>
                      <Link
                        href={`/rutinas/${comment.routine.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 hover:text-primary"
                      >
                        <span className="truncate max-w-[200px]">{comment.routine.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </Link>
                    </>
                  )}
                </div>

                {/* Content */}
                <p className="text-sm leading-relaxed">{comment.content}</p>
              </div>

              {/* Actions */}
              <div className="shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(comment)}
                  disabled={isPending}
                  aria-label="Eliminar comentario"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Routine badge */}
            {comment.routine && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {comment.routine.title}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Count */}
      <p className="mt-4 text-xs text-muted-foreground">
        {comments.length} comentario{comments.length !== 1 ? 's' : ''} activo
        {comments.length !== 1 ? 's' : ''}
      </p>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este comentario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comentario será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget && (
            <blockquote className="rounded border-l-4 border-muted pl-3 text-sm text-muted-foreground italic">
              &ldquo;{deleteTarget.content.slice(0, 120)}
              {deleteTarget.content.length > 120 ? '…' : ''}&rdquo;
            </blockquote>
          )}
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
