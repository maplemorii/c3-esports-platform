"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, RefreshCw, LayoutDashboard } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error("[AdminError]", error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
          Admin Panel Error
        </h1>
        <p className="text-muted-foreground max-w-sm">
          An error occurred in the staff panel. The issue has been noted. You can try again or return to the admin overview.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <button
          onClick={() => router.push("/admin")}
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          <LayoutDashboard className="h-4 w-4" />
          Staff Overview
        </button>
      </div>
    </div>
  )
}
