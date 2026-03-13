import { Skeleton } from "@/components/ui/skeleton"

export default function SeasonMatchesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Filter row */}
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Match rows */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl px-5 py-4 flex items-center gap-5"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center justify-end gap-3 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
