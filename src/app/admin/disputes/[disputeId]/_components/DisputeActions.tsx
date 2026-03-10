"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

type Props = {
  disputeId: string
  currentStatus: string
}

export default function DisputeActions({ disputeId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading]   = useState<"resolve" | "dismiss" | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [resolution, setResolution] = useState("")

  const isTerminal = currentStatus === "RESOLVED" || currentStatus === "DISMISSED"
  if (isTerminal) return null

  async function handleAction(action: "resolve" | "dismiss") {
    if (action === "resolve" && !resolution.trim()) {
      setError("Please enter resolution notes before resolving.")
      return
    }
    setLoading(action)
    setError(null)

    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status:     action === "resolve" ? "RESOLVED" : "DISMISSED",
          resolution: resolution.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message ?? "Action failed. Please try again.")
        return
      }

      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold text-sm">Staff Action</h2>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resolution Notes
        </label>
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          rows={3}
          placeholder="Describe the outcome, corrected scores, or reason for dismissal…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleAction("resolve")}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === "resolve"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <CheckCircle2 className="h-4 w-4" />
          }
          Resolve
        </button>

        <button
          onClick={() => handleAction("dismiss")}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === "dismiss"
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <XCircle className="h-4 w-4" />
          }
          Dismiss
        </button>
      </div>
    </div>
  )
}
