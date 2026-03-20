'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, Dumbbell, Plus } from 'lucide-react'
import { useSession } from '@/components/providers/session-provider'
import { logoutAction } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { CartSheet } from '@/components/cart/cart-sheet'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/buscar', label: 'Explorar' },
  { href: '/tienda', label: 'Tienda' },
]

export function Navbar() {
  const { user } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Dumbbell className="h-5 w-5" aria-hidden="true" />
          <span>GymRoutines</span>
        </Link>

        {/* Links desktop */}
        <ul className="hidden items-center gap-6 md:flex" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Acciones desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <CartSheet />
          {user ? (
            <>
              <Button asChild size="sm" variant="default">
                <Link href="/rutinas/nueva">
                  <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                  Nueva rutina
                </Link>
              </Button>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </div>

        {/* Menú móvil */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="flex items-center gap-2 text-primary">
              <Dumbbell className="h-5 w-5" />
              GymRoutines
            </SheetTitle>
            <div className="mt-6 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-border" />
              {user ? (
                <>
                  <Link
                    href="/rutinas/nueva"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium"
                  >
                    Nueva rutina
                  </Link>
                  <Link
                    href="/dashboard/mis-rutinas"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-muted-foreground"
                  >
                    Mis rutinas
                  </Link>
                  <Link
                    href="/favoritos"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-muted-foreground"
                  >
                    Favoritos
                  </Link>
                  <Link
                    href="/dashboard/mis-pedidos"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-muted-foreground"
                  >
                    Mis pedidos
                  </Link>
                  <button
                    onClick={async () => {
                      setMobileOpen(false)
                      await logoutAction()
                    }}
                    className="text-left text-sm text-destructive"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium text-primary"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}

function UserMenu({ user }: { user: { email?: string | undefined } }) {
  const initial = user.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menú de usuario">
          <Avatar className="h-8 w-8">
            <AvatarImage src={undefined} alt="Avatar" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/mis-rutinas">Mis rutinas</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/favoritos">Favoritos</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/mis-pedidos">Mis pedidos</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/perfil/editar">Editar perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={logoutAction}>
            <button type="submit" className="w-full text-left text-destructive">
              Cerrar sesión
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
