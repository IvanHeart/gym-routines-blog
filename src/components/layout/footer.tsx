import Link from 'next/link'
import { Dumbbell } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-primary">
            <Dumbbell className="h-4 w-4" aria-hidden="true" />
            GymRoutines
          </Link>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GymRoutines. Comparte tu progreso.
          </p>
          <nav aria-label="Footer">
            <ul className="flex gap-4" role="list">
              <li>
                <Link
                  href="/buscar"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Explorar
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Acceder
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
