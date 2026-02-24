'use client'

import { useQueryState } from 'nuqs'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/entities'

interface CategoryFilterProps {
  categories: Category[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const [activeCategory, setActiveCategory] = useQueryState('category', {
    defaultValue: '',
    shallow: false,
  })

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
      <button
        onClick={() => setActiveCategory('')}
        className={cn(
          'inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
          !activeCategory
            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
            : 'border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground'
        )}
        aria-pressed={!activeCategory}
      >
        Todas
      </button>

      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(isActive ? '' : cat.slug)}
            className={cn(
              'inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
              isActive
                ? 'shadow-sm'
                : 'border-border bg-transparent hover:border-[var(--cat-color)]/50'
            )}
            style={
              isActive
                ? {
                    borderColor: `${cat.color}60`,
                    backgroundColor: `${cat.color}25`,
                    color: cat.color,
                  }
                : ({ '--cat-color': cat.color } as React.CSSProperties)
            }
            aria-pressed={isActive}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
