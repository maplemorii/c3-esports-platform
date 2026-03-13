import { Skeleton } from "@/components/ui/skeleton"

export default function TeamsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Team grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Skeleton className="h-1.5 w-full rounded-none" />
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-20 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
