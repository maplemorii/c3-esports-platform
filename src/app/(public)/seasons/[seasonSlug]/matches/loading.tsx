import { Skeleton } from "@/components/ui/skeleton"

export default function MatchScheduleLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Title + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Week groups */}
      {Array.from({ length: 3 }).map((_, w) => (
        <div key={w} className="space-y-2">
          {/* Week header */}
          <div className="flex items-center gap-3 py-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-px flex-1 bg-muted/60" />
            <Skeleton className="h-4 w-28" />
          </div>

          {/* Match rows */}
          {Array.from({ length: 3 }).map((__, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card px-5 py-4 flex items-center gap-4"
            >
              {/* Team A */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                <Skeleton className="h-4 w-24 hidden sm:block" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              {/* Score / status */}
              <div className="flex flex-col items-center gap-1 w-20 shrink-0">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
              {/* Team B */}
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-24 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
