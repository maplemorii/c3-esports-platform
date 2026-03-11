import { Skeleton } from "@/components/ui/skeleton"

export default function MatchDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      {/* Back link */}
      <Skeleton className="h-4 w-24" />

      {/* Status banner */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Teams vs header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-8 w-12 shrink-0 text-center" />
          <div className="flex items-center gap-3 flex-1 justify-end">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          </div>
        </div>
      </div>

      {/* Check-in panel */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Per-game grid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <Skeleton className="h-4 w-28" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
            <Skeleton className="h-4 w-12" />
            <div className="flex-1 flex items-center justify-between gap-3">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-5 w-8 font-mono" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
