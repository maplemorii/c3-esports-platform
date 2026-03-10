"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2 } from "lucide-react"

export default function CheckInButton({ matchId }: { matchId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckIn() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matches/${matchId}/checkin`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message ?? "Check-in failed. Please try again.")
        return
      }
      setDone(true)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
        Checked in!
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Check In Now
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
