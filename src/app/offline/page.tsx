export const metadata = { title: 'Sin conexión' }

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl">📡</div>
      <h1 className="text-2xl font-bold">Sin conexión</h1>
      <p className="text-muted-foreground">
        No hay conexión a internet. Revisa tu conexión e intenta de nuevo.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-md bg-primary px-6 py-2 text-primary-foreground"
      >
        Reintentar
      </button>
    </main>
  )
}
