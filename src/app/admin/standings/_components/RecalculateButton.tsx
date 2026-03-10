"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Loader2 } from "lucide-react"

export function RecalculateButton({ divisionId }: { divisionId: string }) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function recalculate() {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/divisions/${divisionId}/standings/recalculate`, {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Recalculation failed.")
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={recalculate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm font-medium hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <RefreshCw className="h-4 w-4" />
        }
        {loading ? "Recalculating…" : "Recalculate Standings"}
      </button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-400">Standings updated.</p>
      )}
    </div>
  )
}
