export default function AdminLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  )
}
