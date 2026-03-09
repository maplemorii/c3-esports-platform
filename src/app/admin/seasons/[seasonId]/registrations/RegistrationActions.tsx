"use client"

/**
 * RegistrationActions
 *
 * Approve / Reject buttons for a single registration row.
 * Reject opens an inline reason input before confirming.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Check, X, Loader2 } from "lucide-react"

interface Props {
  seasonId:      string
  regId:         string
  currentStatus: string
}

export function RegistrationActions({ seasonId, regId, currentStatus }: Props) {
  const router = useRouter()
  const [pending,       setPending]       = useState<"APPROVED" | "REJECTED" | null>(null)
  const [rejectOpen,    setRejectOpen]    = useState(false)
  const [rejectReason,  setRejectReason]  = useState("")
  const [error,         setError]         = useState<string | null>(null)

  const isDone =
    currentStatus === "APPROVED" ||
    currentStatus === "REJECTED" ||
    currentStatus === "WITHDRAWN"

  async function act(status: "APPROVED" | "REJECTED", notes?: string) {
    setPending(status)
    setError(null)
    try {
      const res = await fetch(`/api/seasons/${seasonId}/registrations/${regId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status, ...(notes ? { notes } : {}) }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setPending(null)
      setRejectOpen(false)
    }
  }

  if (isDone) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          currentStatus === "APPROVED"  && "bg-emerald-500/15 text-emerald-400",
          currentStatus === "REJECTED"  && "bg-destructive/15 text-destructive",
          currentStatus === "WITHDRAWN" && "bg-muted text-muted-foreground",
        )}
      >
        {currentStatus === "APPROVED"  && "Approved"}
        {currentStatus === "REJECTED"  && "Rejected"}
        {currentStatus === "WITHDRAWN" && "Withdrawn"}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* Inline reject reason form */}
      {rejectOpen ? (
        <div className="flex flex-col gap-2 w-64">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            rows={2}
            className={cn(
              "w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs",
              "placeholder:text-muted-foreground resize-none",
              "focus:outline-none focus:ring-1 focus:ring-destructive/50"
            )}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setRejectOpen(false); setRejectReason("") }}
              disabled={pending !== null}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => act("REJECTED", rejectReason.trim() || undefined)}
              disabled={pending !== null}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                "border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50"
              )}
            >
              {pending === "REJECTED"
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <X className="h-3 w-3" />}
              Confirm Reject
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => act("APPROVED")}
            disabled={pending !== null}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {pending === "APPROVED"
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Check className="h-3.5 w-3.5" />}
            Approve
          </button>
          <button
            onClick={() => setRejectOpen(true)}
            disabled={pending !== null}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              "border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
