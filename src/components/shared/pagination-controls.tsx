'use client'

import { useQueryState, parseAsInteger } from 'nuqs'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface PaginationControlsProps {
  total: number
  limit: number
}

export function PaginationControls({ total, limit }: PaginationControlsProps) {
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  )

  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  const pages = getPageNumbers(page, totalPages)

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page > 1) setPage(page - 1)
            }}
            aria-disabled={page <= 1}
            className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {pages.map((p, i) =>
          p === null ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setPage(p)
                }}
                isActive={p === page}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page < totalPages) setPage(page + 1)
            }}
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, null, total]
  if (current >= total - 3) return [1, null, total - 4, total - 3, total - 2, total - 1, total]
  return [1, null, current - 1, current, current + 1, null, total]
}
