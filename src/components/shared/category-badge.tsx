import { cn } from '@/lib/utils'

interface CategoryBadgeProps {
  name: string
  color: string
  className?: string
}

export function CategoryBadge({ name, color, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        className
      )}
      style={{
        borderColor: `${color}40`,
        backgroundColor: `${color}20`,
        color,
      }}
    >
      {name}
    </span>
  )
}
