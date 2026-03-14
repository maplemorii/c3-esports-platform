"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"

export function DeleteAccountButton({ userId }: { userId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Failed to delete account.")
        setLoading(false)
        return
      }
      await signOut({ callbackUrl: "/" })
    } catch {
      setError("Network error. Try again.")
      setLoading(false)
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="self-start text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150"
        style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "rgba(252,165,165,0.7)" }}
      >
        Delete my account
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium" style={{ color: "rgba(252,165,165,0.9)" }}>
        Are you sure? Your profile, team memberships, and match history will be permanently removed.
      </p>
      {error && (
        <p className="text-xs" style={{ color: "rgba(252,165,165,0.7)" }}>{error}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 disabled:opacity-50"
          style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)", color: "rgba(252,165,165,0.9)" }}
        >
          {loading ? "Deleting…" : "Yes, delete my account"}
        </button>
        <button
          onClick={() => { setConfirm(false); setError(null) }}
          className="text-sm px-4 py-2 rounded-xl transition-all duration-150"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
