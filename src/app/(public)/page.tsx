import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GymRoutines — Comparte tus rutinas de gimnasio',
  description: 'Descubre y comparte las mejores rutinas de gimnasio. Crea tu cuenta gratis.',
}

// Sprint 5 completará este componente con el Hero, RutinaGrid, filtros y paginación
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-primary mb-4">GymRoutines</h1>
      <p className="text-muted-foreground text-lg">
        La plataforma para compartir y descubrir rutinas de gimnasio
      </p>
    </div>
  )
}
