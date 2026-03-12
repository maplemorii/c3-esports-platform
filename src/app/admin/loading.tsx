import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Header card */}
      <div
        className="rounded-2xl px-6 py-5 space-y-2"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Activity columns */}
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
