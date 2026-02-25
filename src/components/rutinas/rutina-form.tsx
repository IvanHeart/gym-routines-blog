'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExerciseBuilder } from '@/components/rutinas/exercise-builder'
import { ImageCropPicker, type ImageCropPickerHandle } from '@/components/rutinas/image-crop-picker'
import { routineSchema, type RoutineFormValues } from '@/lib/validations/routine'
import type { Category } from '@/types/entities'
import type { ActionResult } from '@/types/api'

interface RutinaFormProps {
  categories: Category[]
  action: (prev: null, formData: FormData) => Promise<ActionResult<{ slug: string }>>
  defaultValues?: Partial<RoutineFormValues>
  submitLabel?: string
}

export function RutinaForm({
  categories,
  action,
  defaultValues,
  submitLabel = 'Publicar rutina',
}: RutinaFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const cropPickerRef = useRef<ImageCropPickerHandle>(null)

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      difficulty: 'beginner',
      duration_minutes: null,
      category_id: null,
      published: false,
      exercises: [],
      ...defaultValues,
    },
  })

  const handleSubmit = useCallback(
    async (values: RoutineFormValues) => {
      setServerError(null)

      // Crop the visible area before starting the transition
      const croppedFile = (await cropPickerRef.current?.getCroppedFile()) ?? null

      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('excerpt', values.excerpt ?? '')
      formData.append('content', values.content)
      formData.append('difficulty', values.difficulty)
      formData.append('duration_minutes', values.duration_minutes?.toString() ?? '')
      formData.append('category_id', values.category_id ?? '')
      formData.append('published', String(values.published))
      formData.append('exercises', JSON.stringify(values.exercises))
      if (croppedFile) formData.append('cover_image', croppedFile)

      startTransition(async () => {
        const result = await action(null, formData)
        if (!result.success) {
          setServerError(result.error)
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              form.setError(field as keyof RoutineFormValues, {
                message: messages?.[0] ?? 'Error en este campo',
              })
            })
          }
        }
      })
    },
    [action, cropPickerRef, form, startTransition]
  )

  return (
    <Form {...form}>
      {/* eslint-disable-next-line react-hooks/refs -- handleSubmit only accesses ref in event handler, not during render */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8" noValidate>
        {/* Error global del servidor */}
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Imagen de portada */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Imagen de portada</p>
          <ImageCropPicker ref={cropPickerRef} />
        </div>

        {/* Título */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la rutina *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Full Body 3x semana para principiantes" {...field} />
              </FormControl>
              <FormDescription>Entre 5 y 100 caracteres</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Resumen */}
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumen</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Breve descripción que verán en el listado..."
                  rows={2}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>Máximo 300 caracteres</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción completa */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción completa *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explica la rutina: objetivos, estructura, consejos..."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Dificultad */}
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dificultad *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duración */}
          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="60"
                    min={5}
                    max={300}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoría */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                  defaultValue={field.value ?? 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
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
        </div>

        {/* ExerciseBuilder */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Ejercicios *</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Añade y ordena los ejercicios arrastrándolos
            </p>
          </div>
          <ExerciseBuilder />
          {form.formState.errors.exercises?.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.exercises.root.message}
            </p>
          )}
          {form.formState.errors.exercises?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.exercises.message}</p>
          )}
        </div>

        {/* Publicar ahora */}
        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 rounded-lg border border-border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="published" />
              </FormControl>
              <div>
                <FormLabel htmlFor="published" className="cursor-pointer">
                  Publicar ahora
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Si no marcas esto, quedará como borrador
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Guardando...' : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
