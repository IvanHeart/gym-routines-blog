'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'user' | 'model'
  text: string
}

const PRODUCT_LINK_RE = /\/tienda\/[a-z0-9-]+/g

function parseLinks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  PRODUCT_LINK_RE.lastIndex = 0
  while ((match = PRODUCT_LINK_RE.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    parts.push(
      <Link
        key={match.index}
        href={match[0]}
        className="underline font-medium hover:opacity-80"
      >
        {match[0]}
      </Link>
    )
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(text.slice(last))
  }

  return parts.length > 0 ? parts : [text]
}

export function ChatMessage({ role, text }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      data-role={role}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {parseLinks(text)}
      </div>
    </div>
  )
}
