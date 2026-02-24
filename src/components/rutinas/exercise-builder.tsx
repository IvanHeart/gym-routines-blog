'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import type { RoutineFormValues } from '@/lib/validations/routine'

function ExerciseRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { control } = useFormContext<RoutineFormValues>()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `exercise-${index}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 rounded-lg border border-border/50 bg-card p-3"
    >
      {/* Handle */}
      <button
        type="button"
        className="mt-2 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Arrastrar ejercicio"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 grid gap-2">
        {/* Nombre */}
        <FormField
          control={control}
          name={`exercises.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Nombre del ejercicio*" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-2">
          {/* Series */}
          <FormField
            control={control}
            name={`exercises.${index}.sets`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Series"
                    min={1}
                    max={99}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Reps */}
          <FormField
            control={control}
            name={`exercises.${index}.reps`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Reps (ej: 8-12)"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Descanso */}
          <FormField
            control={control}
            name={`exercises.${index}.rest_seconds`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Descanso (s)"
                    min={0}
                    max={600}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Notas */}
        <FormField
          control={control}
          name={`exercises.${index}.notes`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Notas (opcional)"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Eliminar */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="mt-1 h-7 w-7 text-muted-foreground hover:text-destructive"
        aria-label="Eliminar ejercicio"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ExerciseBuilder() {
  const { control } = useFormContext<RoutineFormValues>()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'exercises',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIndex = fields.findIndex((_, i) => `exercise-${i}` === active.id)
    const overIndex = fields.findIndex((_, i) => `exercise-${i}` === over.id)
    if (activeIndex !== -1 && overIndex !== -1) {
      move(activeIndex, overIndex)
    }
  }

  function addExercise() {
    append({
      name: '',
      sets: null,
      reps: null,
      rest_seconds: null,
      notes: null,
      order_index: fields.length,
    })
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={fields.map((_, i) => `exercise-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          {fields.map((field, index) => (
            <ExerciseRow key={field.id} index={index} onRemove={() => remove(index)} />
          ))}
        </SortableContext>
      </DndContext>

      {fields.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-lg">
          Añade ejercicios para construir tu rutina
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addExercise}
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        Añadir ejercicio
      </Button>
    </div>
  )
}
