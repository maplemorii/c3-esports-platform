"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(196,28,53,0.8), transparent 70%)",
          filter: "blur(60px)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(196,28,53,0.08)", border: "1px solid rgba(196,28,53,0.2)" }}
        >
          <AlertTriangle className="h-8 w-8" style={{ color: "rgba(196,28,53,0.8)" }} />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
            Something Went Wrong
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            An unexpected error occurred. You can try again or return to the home page.
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
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))",
              boxShadow: "0 0 20px rgba(196,28,53,0.2)",
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/30"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
