import Link from "next/link"
import { Users, ChevronLeft } from "lucide-react"

export default function TeamNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="flex justify-center mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
          <Users className="h-10 w-10 text-muted-foreground/30" />
        </div>
      </div>

      <p className="font-display text-6xl font-bold text-brand/40 select-none mb-4">404</p>

      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide mb-2">
        Team Not Found
      </h1>
      <p className="text-muted-foreground max-w-sm mx-auto mb-8">
        This team doesn&apos;t exist or may have been removed. Browse all active teams below.
      </p>

      <Link
        href="/teams"
        className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
      >
        <ChevronLeft className="h-4 w-4" />
        All Teams
      </Link>
    </div>
  )
}
