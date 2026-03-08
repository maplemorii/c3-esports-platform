"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    // Log to your error reporting service here (e.g. Sentry)
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <p className="font-display text-8xl font-bold text-destructive select-none">!</p>

      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
          Something Went Wrong
        </h1>
        <p className="text-muted-foreground max-w-sm">
          An unexpected error occurred. You can try again or go back to the home page.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          Try Again
        </button>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}
