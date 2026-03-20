'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { createProductCategoryAction, deleteProductCategoryAction } from '@/actions/shop.actions'
import { productCategorySchema, type ProductCategoryFormValues } from '@/lib/validations/shop'
import type { ProductCategory } from '@/types/entities'

interface Props {
  categories: ProductCategory[]
}

export function ProductCategoryForm({ categories }: Props) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null)

  const form = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: { name: '', slug: '', color: '#6366f1' },
  })

  async function handleCreate(values: ProductCategoryFormValues) {
    const fd = new FormData()
    fd.append('name', values.name)
    fd.append('slug', values.slug)
    fd.append('color', values.color)

    startTransition(async () => {
      const result = await createProductCategoryAction(null, fd)
      if (result.success) {
        toast.success('Categoría creada')
        form.reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(category: ProductCategory) {
    startTransition(async () => {
      const result = await deleteProductCategoryAction(category.id)
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
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">Nueva categoría de producto</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreate)} className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Suplementos" {...field} />
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
                    <Input placeholder="suplementos" {...field} />
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

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay categorías de producto todavía.</p>
      ) : (
        <ul className="space-y-2" role="list">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-medium">{cat.name}</span>
                <span className="text-xs text-muted-foreground font-mono">/{cat.slug}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(cat)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Los productos en &ldquo;{deleteTarget?.name}&rdquo; quedarán sin categoría.
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
