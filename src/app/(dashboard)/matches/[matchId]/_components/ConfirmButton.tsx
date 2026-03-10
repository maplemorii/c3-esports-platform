"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2 } from "lucide-react"

export default function ConfirmButton({ matchId }: { matchId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matches/${matchId}/confirm`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message ?? "Confirmation failed. Please try again.")
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
        Result confirmed!
      </span>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <CheckCircle2 className="h-4 w-4" />
        Confirm Result
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
