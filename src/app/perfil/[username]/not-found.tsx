import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PerfilNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-2xl font-bold">Perfil no encontrado</h1>
      <p className="text-muted-foreground max-w-sm">
        Este usuario no existe o no tiene perfil público.
      </p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}
