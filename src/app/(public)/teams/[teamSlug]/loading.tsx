import { Skeleton } from "@/components/ui/skeleton"

export default function TeamProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      {/* Back link */}
      <Skeleton className="h-4 w-20" />

      {/* Team header card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-2 w-full bg-muted/60" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Logo */}
            <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          {/* Social row */}
          <div className="mt-6 flex gap-4 border-t border-border pt-5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Season history */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
