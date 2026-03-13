import { Skeleton } from "@/components/ui/skeleton"

export default function SeasonsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Season cards */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl p-6"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.4), rgba(59,130,246,0.2), transparent)" }}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
            </div>
            <div className="mt-4 flex gap-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
