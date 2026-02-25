'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-6xl font-bold text-muted-foreground/20">!</p>
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="text-muted-foreground max-w-sm">
        Se ha producido un error inesperado. Por favor, inténtalo de nuevo.
      </p>
      <Button onClick={reset}>Intentar de nuevo</Button>
    </div>
  )
}
