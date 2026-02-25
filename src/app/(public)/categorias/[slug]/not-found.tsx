import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CategoriaNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-2xl font-bold">Categoría no encontrada</h1>
      <p className="text-muted-foreground max-w-sm">
        Esta categoría no existe o ha sido eliminada.
      </p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}
