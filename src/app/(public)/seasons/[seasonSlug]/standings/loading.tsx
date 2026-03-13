import { Skeleton } from "@/components/ui/skeleton"

export default function StandingsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Division tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 rounded-xl" />
        ))}
      </div>

      {/* Standings table */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
          aria-hidden
        />
        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-full max-w-16" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 items-center px-5 py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3 col-span-2">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-28" />
            </div>
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-8" />
            ))}
          </div>
        ))}
      </div>

    </div>
  )
}
