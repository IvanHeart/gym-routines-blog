'use client'

import { useRef, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createCommentAction, deleteCommentAction } from '@/actions/comments.actions'
import type { CommentWithAuthor } from '@/dal/comments.dal'

interface CommentSectionProps {
  routineId: string
  routineSlug: string
  comments: CommentWithAuthor[]
  currentUserId: string | null
  currentUserRole: string | null
}

export function CommentSection({
  routineId,
  routineSlug,
  comments,
  currentUserId,
  currentUserRole,
}: CommentSectionProps) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!currentUserId) {
      toast.error('Inicia sesión para comentar')
      return
    }

    const fd = new FormData(e.currentTarget)
    const content = fd.get('content') as string
    if (!content?.trim()) return

    startTransition(async () => {
      const result = await createCommentAction(routineId, routineSlug, null, fd)
      if (result.success) {
        formRef.current?.reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  async function handleDelete(commentId: string) {
    startTransition(async () => {
      const result = await deleteCommentAction(commentId, routineSlug)
      if (!result.success) toast.error(result.error)
    })
  }

  return (
    <section className="space-y-6" aria-label="Comentarios">
      <h2 className="text-lg font-semibold">
        Comentarios{' '}
        <span className="text-sm text-muted-foreground font-normal">({comments.length})</span>
      </h2>

      {/* Formulario nuevo comentario */}
      {currentUserId ? (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            name="content"
            placeholder="Escribe un comentario..."
            rows={3}
            required
            maxLength={1000}
            disabled={isPending}
            className="resize-none"
          />
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Publicando...' : 'Publicar comentario'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">
            Inicia sesión
          </a>{' '}
          para comentar.
        </p>
      )}

      {/* Lista de comentarios */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Sé el primero en comentar esta rutina.</p>
      ) : (
        <ul className="space-y-4" role="list">
          {comments.map((comment) => {
            const initial = comment.author?.username?.[0]?.toUpperCase() ?? 'U'
            const canDelete = currentUserId === comment.author_id || currentUserRole === 'admin'

            return (
              <li
                key={comment.id}
                className="flex gap-3 rounded-lg border border-border/50 bg-card p-4"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={comment.author?.avatar_url ?? undefined}
                    alt={comment.author?.username}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium truncate">
                      {comment.author?.username ?? 'Anónimo'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <time className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </time>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(comment.id)}
                          disabled={isPending}
                          aria-label="Eliminar comentario"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
