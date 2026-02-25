'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import { CategoryBadge } from '@/components/shared/category-badge'
import { createCategoryAction, deleteCategoryAction } from '@/actions/admin.actions'
import type { Category } from '@/types/entities'

const formSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

type FormValues = z.infer<typeof formSchema>

interface CategoryAdminPanelProps {
  categories: Category[]
}

export function CategoryAdminPanel({ categories }: CategoryAdminPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', slug: '', color: '#6366f1' },
  })

  async function handleCreate(values: FormValues) {
    const fd = new FormData()
    fd.append('name', values.name)
    fd.append('slug', values.slug)
    fd.append('color', values.color)

    startTransition(async () => {
      const result = await createCategoryAction(null, fd)
      if (result.success) {
        toast.success('Categoría creada')
        form.reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(category: Category) {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id)
      if (result.success) {
        toast.success('Categoría eliminada')
        setDeleteTarget(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Formulario crear */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">Nueva categoría</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreate)} className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Pecho" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="pecho" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={field.value}
                        onChange={field.onChange}
                        className="h-9 w-12 rounded border border-border cursor-pointer bg-transparent"
                        aria-label="Elegir color"
                      />
                      <Input {...field} placeholder="#6366f1" className="font-mono text-sm" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-3">
              <Button type="submit" size="sm" disabled={isPending} className="gap-2">
                <Plus className="h-4 w-4" />
                {isPending ? 'Creando...' : 'Crear categoría'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Lista */}
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay categorías todavía.</p>
      ) : (
        <ul className="space-y-2" role="list">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <CategoryBadge name={cat.name} color={cat.color} />
                <span className="text-xs text-muted-foreground font-mono">/{cat.slug}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(cat)}
                aria-label={`Eliminar ${cat.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Confirm delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Las rutinas en &ldquo;{deleteTarget?.name}&rdquo; quedarán sin categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
