"use client"

/**
 * DisputeCard
 *
 * Reusable dispute summary card with inline Resolve / Dismiss actions.
 * Used on match detail pages and anywhere a compact dispute view is needed.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, XCircle, Eye, Loader2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DisputeStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DisputeCardData = {
  id: string
  status: DisputeStatus
  reason: string
  evidenceUrl?: string | null
  resolution?: string | null
  createdAt: string | Date
  resolvedAt?: string | null | Date
  filedByTeamName?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<DisputeStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  OPEN:         { label: "Open",         cls: "bg-destructive/15 text-destructive",  icon: <AlertTriangle className="h-3 w-3" /> },
  UNDER_REVIEW: { label: "Under Review", cls: "bg-amber-500/15 text-amber-400",      icon: <Eye className="h-3 w-3" /> },
  RESOLVED:     { label: "Resolved",     cls: "bg-emerald-500/15 text-emerald-400",  icon: <CheckCircle2 className="h-3 w-3" /> },
  DISMISSED:    { label: "Dismissed",    cls: "bg-muted text-muted-foreground",       icon: <XCircle className="h-3 w-3" /> },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DisputeCard({ dispute }: { dispute: DisputeCardData }) {
  const router = useRouter()
  const meta = STATUS_META[dispute.status]
  const isTerminal = dispute.status === "RESOLVED" || dispute.status === "DISMISSED"

  const [loading, setLoading]     = useState<"resolve" | "dismiss" | null>(null)
  const [resolution, setResolution] = useState("")
  const [error, setError]         = useState<string | null>(null)

  async function handleAction(action: "resolve" | "dismiss") {
    if (action === "resolve" && !resolution.trim()) {
      setError("Please enter resolution notes before resolving.")
      return
    }
    setLoading(action)
    setError(null)

    try {
      const res = await fetch(`/api/disputes/${dispute.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status:     action === "resolve" ? "RESOLVED" : "DISMISSED",
          resolution: resolution.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message ?? data.error ?? "Action failed. Please try again.")
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
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Dispute</span>
          {dispute.filedByTeamName && (
            <span className="text-xs text-muted-foreground">· filed by {dispute.filedByTeamName}</span>
          )}
        </div>
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
          meta.cls,
        )}>
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Reason */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
          <p className="text-sm">{dispute.reason}</p>
        </div>

        {/* Evidence link */}
        {dispute.evidenceUrl && (
          <a
            href={dispute.evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View Evidence
          </a>
        )}

        {/* Resolution (if terminal) */}
        {dispute.resolution && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Resolution</p>
            <p className="text-sm text-muted-foreground">{dispute.resolution}</p>
          </div>
        )}

        {/* Staff actions (non-terminal only) */}
        {!isTerminal && (
          <div className="space-y-3 pt-1 border-t border-border mt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resolution Notes
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={2}
                placeholder="Describe the outcome or reason for dismissal…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleAction("resolve")}
                disabled={!!loading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === "resolve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Resolve
              </button>
              <button
                onClick={() => handleAction("dismiss")}
                disabled={!!loading}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === "dismiss" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
