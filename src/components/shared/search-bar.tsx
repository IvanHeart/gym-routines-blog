'use client'

import { useQueryState } from 'nuqs'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useCallback, useState } from 'react'

export function SearchBar() {
  const [q, setQ] = useQueryState('q', { defaultValue: '', shallow: false, throttleMs: 300 })
  const [localValue, setLocalValue] = useState(q)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value)
      setQ(e.target.value || null)
    },
    [setQ]
  )

  return (
    <div className="relative flex-1 min-w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Buscar rutinas..."
        value={localValue}
        onChange={handleChange}
        className="pl-9"
        id="search-rutinas"
        name="q"
        aria-label="Buscar rutinas"
      />
    </div>
  )
}
