"use client"

/**
 * TrackerUrlInput
 *
 * Lets a player save or clear their Rocket League Tracker Network profile URL.
 * Shown in the Tracker AccountRow on the profile page.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Link2, Link2Off, ExternalLink } from "lucide-react"

interface TrackerUrlInputProps {
  trackerUrl: string | null
  playerId:   string
}

export function TrackerUrlInput({ trackerUrl, playerId }: TrackerUrlInputProps) {
  const router   = useRouter()
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(trackerUrl ?? "")
  const [busy,    setBusy]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSave() {
    const url = value.trim()
    if (url && !url.includes("tracker.network")) {
      setError("Must be a tracker.network URL")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ trackerUrl: url || null }),
      })
      if (res.ok) {
        setEditing(false)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Failed to save")
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleUnlink() {
    if (!confirm("Remove your Tracker Network link?")) return
    setBusy(true)
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ trackerUrl: null }),
      })
      if (res.ok) {
        setValue("")
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="mt-2 flex flex-col gap-1.5">
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://rocketleague.tracker.network/..."
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-brand/50"
          autoFocus
        />
        {error && <p className="text-[11px] text-destructive">{error}</p>}
        <div className="flex gap-1.5">
          <button
            onClick={handleSave}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-400 disabled:opacity-50"
            style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)" }}
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Save
          </button>
          <button
            onClick={() => { setEditing(false); setValue(trackerUrl ?? ""); setError(null) }}
            className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (trackerUrl) {
    return (
      <div className="mt-2 flex gap-1.5">
        <a
          href={trackerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-400 transition-colors hover:text-sky-300"
          style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)" }}
        >
          <ExternalLink className="h-3 w-3" />
          View Profile
        </a>
        <button
          onClick={handleUnlink}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
          Unlink
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-400 transition-colors hover:text-sky-300"
      style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)" }}
    >
      <Link2 className="h-3 w-3" />
      Add Tracker Link
    </button>
  )
}
