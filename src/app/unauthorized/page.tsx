import type { Metadata } from "next"
import Link from "next/link"
import { ShieldOff, ChevronLeft, LogIn } from "lucide-react"

export const metadata: Metadata = { title: "403 — Unauthorized" }

export default function UnauthorizedPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-24 text-center overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(196,28,53,0.6), transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Icon */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(196,28,53,0.08)",
            border: "1px solid rgba(196,28,53,0.2)",
          }}
        >
          <ShieldOff className="h-9 w-9" style={{ color: "rgba(196,28,53,0.8)" }} />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <p
            className="font-display text-7xl font-black select-none"
            style={{ color: "rgba(196,28,53,0.2)" }}
          >
            403
          </p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
            Access Denied
          </h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground leading-relaxed">
            You don&apos;t have permission to view this page. If you think this is a mistake, contact a staff member.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150"
            style={{
              background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))",
              boxShadow: "0 0 20px rgba(196,28,53,0.2)",
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/30"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
