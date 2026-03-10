"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function EduOverrideButton({
  userId,
  currentOverride,
  currentNote,
}: {
  userId: string
  currentOverride: boolean
  currentNote?: string | null
}) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [note, setNote]       = useState(currentNote ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function apply(approved: boolean) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/edu-override`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ approved, note: note.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Failed.")
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
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
          currentOverride
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-border bg-card text-muted-foreground hover:bg-muted/30",
        )}
      >
        <GraduationCap className="h-3 w-3" />
        {currentOverride ? "Verified (override)" : "Edu Override"}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="w-64 rounded-lg border border-border bg-card p-3 space-y-2.5 shadow-lg">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Staff Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Community college, no .edu domain"
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => apply(true)}
              disabled={loading}
              className="flex-1 rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Approve"}
            </button>
            <button
              onClick={() => apply(false)}
              disabled={loading}
              className="flex-1 rounded-md border border-destructive/40 px-2 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              Revoke
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
