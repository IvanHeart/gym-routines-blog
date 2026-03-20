'use client'

import { useQueryState } from 'nuqs'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProductCategory } from '@/types/entities'

interface ProductFiltersProps {
  categories: ProductCategory[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const [search, setSearch] = useQueryState('q', { defaultValue: '' })
  const [category, setCategory] = useQueryState('categoria', { defaultValue: '' })
  const [sort, setSort] = useQueryState('orden', { defaultValue: 'newest' })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value || null)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <Select value={category} onValueChange={(v) => setCategory(v === 'all' ? null : v)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.slug} value={cat.slug}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sort} onValueChange={(v) => setSort(v)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Más recientes</SelectItem>
          <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
          <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
          <SelectItem value="name">Nombre A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
