import { Skeleton } from "@/components/ui/skeleton"

export default function TeamProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">

      {/* Team header */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Skeleton className="h-1.5 w-full rounded-none" />
        <div className="p-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2 mt-1">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-3 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Roster */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.4), rgba(59,130,246,0.2), transparent)" }}
          aria-hidden
        />
        <div className="px-6 py-4 border-b border-border">
          <Skeleton className="h-3.5 w-28" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-3 border-b border-border last:border-0">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full shrink-0" />
          </div>
        ))}
      </div>

    </div>
  )
}
