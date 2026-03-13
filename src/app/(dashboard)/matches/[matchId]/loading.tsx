import { Skeleton } from "@/components/ui/skeleton"

export default function MatchDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">

      {/* Back link */}
      <Skeleton className="h-4 w-24" />

      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.35), transparent)" }}
          aria-hidden
        />
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        {/* Teams + score */}
        <div className="grid grid-cols-3 items-center gap-4 px-5 py-10">
          <div className="flex flex-col items-center gap-2.5">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex flex-col items-center gap-2.5">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      {/* Games grid */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.4), rgba(196,28,53,0.2), transparent)" }}
          aria-hidden
        />
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-5 px-5 py-4 border-b border-border last:border-0">
            <Skeleton className="h-6 w-6 shrink-0" />
            <div className="w-28 shrink-0 space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-5 w-8" />
              </div>
            </div>
            <Skeleton className="flex-1 h-8 rounded-lg" />
          </div>
        ))}
      </div>

    </div>
  )
}
