"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, RotateCcw, Loader2, ChevronDown, ChevronUp } from "lucide-react"

export function DisableUserButton({
  userId,
  isDisabled,
}: {
  userId:     string
  isDisabled: boolean
}) {
  const router  = useRouter()
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function toggle(disable: boolean) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/disable`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ disabled: disable }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Failed.")
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError("Network error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
          isDisabled
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-border bg-card text-muted-foreground hover:bg-muted/30",
        ].join(" ")}
      >
        {isDisabled ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
        {isDisabled ? "Disabled" : "Disable"}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="w-56 rounded-xl border border-border bg-card p-3 space-y-2 shadow-lg z-10">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {isDisabled
              ? "Re-enable this account. The user will be able to sign in again."
              : "Disable this account. All active sessions will be terminated immediately."}
          </p>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <button
            onClick={() => toggle(!isDisabled)}
            disabled={loading}
            className={[
              "w-full rounded-md px-2 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors",
              isDisabled
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "border border-destructive/40 text-destructive hover:bg-destructive/10",
            ].join(" ")}
          >
            {loading
              ? <Loader2 className="h-3 w-3 animate-spin mx-auto" />
              : isDisabled ? "Re-enable Account" : "Disable Account"}
          </button>
        </div>
      )}
    </div>
  )
}
