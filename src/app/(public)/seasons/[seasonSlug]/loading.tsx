import { Skeleton } from "@/components/ui/skeleton"

export default function SeasonOverviewLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-10">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Hero */}
      <div className="mb-10 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Divisions grid */}
      <section className="mb-12">
        <Skeleton className="h-4 w-20 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-7 w-24 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info strip */}
      <div className="rounded-xl border border-border bg-card p-5 grid gap-3 sm:grid-cols-3 mb-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
