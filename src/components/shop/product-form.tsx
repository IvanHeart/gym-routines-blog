'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createProductAction, updateProductAction } from '@/actions/shop.actions'
import { productSchema, type ProductFormValues } from '@/lib/validations/shop'
import type { Product, ProductCategory } from '@/types/entities'

interface Props {
  product?: Product
  categories: ProductCategory[]
}

export function ProductForm({ product, categories }: Props) {
  const [isPending, startTransition] = useTransition()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  const router = useRouter()
  const isEditing = !!product

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      brand: product?.brand ?? '',
      weight: product?.weight ?? undefined,
      dimensions: product?.dimensions ?? '',
      category_id: product?.category_id ?? undefined,
      published: product?.published ?? false,
    },
  })

  function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setImageFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  function handleImageRemove(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleExistingImageRemove(imageId: string) {
    setDeletedImageIds((prev) => [...prev, imageId])
  }

  async function onSubmit(values: ProductFormValues) {
    const fd = new FormData()
    if (isEditing) fd.set('id', product.id)
    fd.set('name', values.name)
    fd.set('description', values.description)
    fd.set('price', String(values.price))
    fd.set('stock', String(values.stock))
    fd.set('brand', values.brand ?? '')
    fd.set('weight', values.weight ? String(values.weight) : '')
    fd.set('dimensions', values.dimensions ?? '')
    fd.set('category_id', values.category_id ?? '')
    fd.set('published', String(values.published))

    if (isEditing) {
      imageFiles.forEach((file) => fd.append('new_images', file))
      if (deletedImageIds.length > 0) {
        fd.set('deleted_image_ids', JSON.stringify(deletedImageIds))
      }
    } else {
      imageFiles.forEach((file) => fd.append('images', file))
    }

    startTransition(async () => {
      const action = isEditing ? updateProductAction : createProductAction
      const result = await action(null, fd)
      if (result.success) {
        toast.success(isEditing ? 'Producto actualizado' : 'Producto creado')
        router.push('/admin/tienda')
      } else {
        toast.error(result.error)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof ProductFormValues, {
              message: messages?.[0],
            })
          })
        }
      }
    })
  }

  const existingImages = product?.images?.filter((img) => !deletedImageIds.includes(img.id)) ?? []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Proteína Whey Gold 2kg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe el producto..." rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (MXN)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="750.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Optimum Nutrition" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (gramos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2000"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dimensions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dimensiones</FormLabel>
                <FormControl>
                  <Input placeholder="30x20x15 cm" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Images */}
        <div className="space-y-3">
          <FormLabel>Imágenes</FormLabel>
          <div className="flex flex-wrap gap-3">
            {existingImages
              .sort((a, b) => a.order_index - b.order_index)
              .map((img) => (
                <div
                  key={img.id}
                  className="relative h-24 w-24 rounded-md overflow-hidden bg-muted"
                >
                  <Image
                    src={img.url}
                    alt=""
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleExistingImageRemove(img.id)}
                    className="absolute top-1 right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            {imageFiles.map((file, i) => (
              <div key={i} className="relative h-24 w-24 rounded-md overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(i)}
                  className="absolute top-1 right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border hover:border-primary transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageAdd}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Published toggle */}
        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">Publicado</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEditing
                ? 'Guardando...'
                : 'Creando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear producto'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/tienda')}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
