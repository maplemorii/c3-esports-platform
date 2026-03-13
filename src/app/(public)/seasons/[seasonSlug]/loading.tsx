import { Skeleton } from "@/components/ui/skeleton"

export default function SeasonDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-10"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.35), transparent)" }}
          aria-hidden
        />
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-20 rounded-full" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Divisions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 space-y-3"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ))}
      </div>

    </div>
  )
}
