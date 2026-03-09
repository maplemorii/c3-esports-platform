"use client"

/**
 * RegistrationActions
 *
 * Approve / Reject buttons for a single registration row.
 * Calls PATCH /api/seasons/:seasonId/registrations/:regId and refreshes the page.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Check, X, Loader2 } from "lucide-react"

interface Props {
  seasonId:       string
  regId:          string
  currentStatus:  string
}

type Action = "APPROVED" | "REJECTED"

export function RegistrationActions({ seasonId, regId, currentStatus }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState<Action | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const isDone = currentStatus === "APPROVED" || currentStatus === "REJECTED" || currentStatus === "WITHDRAWN"

  async function act(status: Action) {
    setPending(status)
    setError(null)
    try {
      const res = await fetch(`/api/seasons/${seasonId}/registrations/${regId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
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
    <div className="flex flex-col items-end gap-1">
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
            : <Check className="h-3.5 w-3.5" />
          }
          Approve
        </button>
        <button
          onClick={() => act("REJECTED")}
          disabled={pending !== null}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            "border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {pending === "REJECTED"
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <X className="h-3.5 w-3.5" />
          }
          Reject
        </button>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
