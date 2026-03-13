"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react"

export function AdminTeamControls({
  teamId,
  currentName,
  hasLogo,
}: {
  teamId:      string
  currentName: string
  hasLogo:     boolean
}) {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [name,    setName]    = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function patch(payload: object) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/30"
      >
        <Pencil className="h-3 w-3" />
        Override
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="w-64 rounded-xl border border-border bg-card p-3.5 space-y-3 shadow-lg z-10">
          {/* Rename */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Team Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            <button
              onClick={() => patch({ name: name.trim() || undefined })}
              disabled={loading || name.trim() === currentName}
              className="w-full rounded-md bg-card border border-border px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/30 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Rename Team"}
            </button>
          </div>

          {/* Clear logo */}
          {hasLogo && (
            <div className="border-t border-border pt-3">
              <button
                onClick={() => patch({ clearLogo: true })}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-destructive/40 px-2 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Clear Logo
              </button>
            </div>
          )}

          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}
