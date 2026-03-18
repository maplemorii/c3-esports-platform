"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { DestructiveButton } from "@/components/ui/destructive-button"

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
      <DestructiveButton onClick={handleDelete} disabled={loading}>
        {loading
          ? <><Loader2 className="inline h-3 w-3 animate-spin mr-1" />Deleting…</>
          : confirmed
            ? "Click again to confirm"
            : "Delete Match"
        }
      </DestructiveButton>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
