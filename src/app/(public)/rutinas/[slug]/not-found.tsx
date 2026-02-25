import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RutinaNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-2xl font-bold">Rutina no encontrada</h1>
      <p className="text-muted-foreground max-w-sm">
        Esta rutina no existe o ha sido eliminada por su autor.
      </p>
      <Button asChild>
        <Link href="/">Explorar rutinas</Link>
      </Button>
    </div>
  )
}
