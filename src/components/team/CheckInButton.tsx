"use client"

/**
 * CheckInButton
 *
 * Calls POST /api/matches/:matchId/checkin and refreshes the page on success.
 * Renders nothing if the team has already checked in.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

interface CheckInButtonProps {
  matchId:       string
  alreadyDone:   boolean
}

export function CheckInButton({ matchId, alreadyDone }: CheckInButtonProps) {
  const router = useRouter()
  const [busy, setBusy]     = useState(false)
  const [done, setDone]     = useState(alreadyDone)
  const [error, setError]   = useState<string | null>(null)

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        Checked In
      </span>
    )
  }

  async function handleCheckIn() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/matches/${matchId}/checkin`, { method: "POST" })
      if (res.ok) {
        setDone(true)
        router.refresh()
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? "Check-in failed")
      }
    } catch {
      setError("Network error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCheckIn}
        disabled={busy}
        className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
      >
        {busy
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <ShieldCheck className="h-3.5 w-3.5" />}
        Check In
      </button>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  )
}
