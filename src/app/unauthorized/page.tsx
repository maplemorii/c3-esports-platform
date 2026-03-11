import type { Metadata } from "next"
import Link from "next/link"
import { ShieldOff, ChevronLeft, LogIn } from "lucide-react"

export const metadata: Metadata = { title: "403 — Unauthorized" }

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10">
        <ShieldOff className="h-10 w-10 text-destructive" />
      </div>

      <div className="space-y-2">
        <p className="font-display text-6xl font-bold text-destructive/30 select-none">403</p>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
          Access Denied
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          You don&apos;t have permission to view this page. If you think this is a mistake, contact a staff member.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <ChevronLeft className="h-4 w-4" />
          Go Home
        </Link>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Link>
      </div>
    </div>
  )
}
