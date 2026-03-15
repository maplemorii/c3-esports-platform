"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"

export function DeleteMatchButton({ matchId }: { matchId: string }) {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleDelete() {
    if (!confirmed) { setConfirmed(true); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/matches/${matchId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Delete failed.")
        setConfirmed(false)
        return
      }
      router.push("/admin/matches")
    } catch {
      setError("Network error.")
      setConfirmed(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        {confirmed ? "Click again to confirm" : "Delete Match"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
