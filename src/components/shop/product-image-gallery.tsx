'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ProductImage } from '@/types/entities'

export function ProductImageGallery({ images }: { images: ProductImage[] }) {
  const sorted = [...images].sort((a, b) => a.order_index - b.order_index)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = sorted[selectedIndex]

  if (sorted.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">Sin imagen</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        {selected && (
          <Image
            src={selected.url}
            alt="Producto"
            width={600}
            height={600}
            className="h-full w-full object-cover"
            priority
          />
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                'h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                i === selectedIndex ? 'border-primary' : 'border-transparent hover:border-border'
              )}
            >
              <Image
                src={img.url}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
