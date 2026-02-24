import { redirect } from 'next/navigation'

// El home real está en (public)/page.tsx
// Esta redirección evita conflictos de rutas
export default function RootPage() {
  redirect('/')
}
