import { Skeleton } from "@/components/ui/skeleton"

export default function StandingsLoading() {
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

      {/* Title */}
      <Skeleton className="h-10 w-52" />

      {/* Division tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-lg" />
        ))}
      </div>

      {/* Standings table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-8 gap-2 px-4 py-3 border-b border-border">
          {["#", "Team", "GP", "W", "L", "GD", "GW", "Pts"].map((h) => (
            <Skeleton key={h} className="h-3 w-8" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-8 gap-2 items-center px-4 py-3 border-b border-border last:border-0"
          >
            <Skeleton className="h-4 w-4" />
            <div className="flex items-center gap-2 col-span-2">
              <Skeleton className="h-6 w-6 rounded-md shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            {Array.from({ length: 5 }).map((__, j) => (
              <Skeleton key={j} className="h-4 w-6" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
