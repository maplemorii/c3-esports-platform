"use client"

import { useState, useTransition } from "react"
import { Bell } from "lucide-react"

interface Props {
  initial: {
    emailNotifResults:  boolean
    emailNotifDisputes: boolean
    emailNotifReplays:  boolean
  }
}

interface Prefs {
  emailNotifResults:  boolean
  emailNotifDisputes: boolean
  emailNotifReplays:  boolean
}

const LABELS: { key: keyof Prefs; label: string; description: string }[] = [
  {
    key:         "emailNotifResults",
    label:       "Match results submitted",
    description: "Email when the opposing team submits scores for your match.",
  },
  {
    key:         "emailNotifDisputes",
    label:       "Dispute opened",
    description: "Email when a dispute is filed for one of your matches.",
  },
  {
    key:         "emailNotifReplays",
    label:       "Replay parse failed",
    description: "Email when a replay you uploaded fails to parse.",
  },
]

export function NotificationPrefs({ initial }: Props) {
  const [prefs, setPrefs]   = useState<Prefs>(initial)
  const [error, setError]   = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function toggle(key: keyof Prefs) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setError(null)

    startTransition(async () => {
      const res = await fetch("/api/users/me/notifications", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ [key]: next[key] }),
      })
      if (!res.ok) {
        // Revert on failure
        setPrefs(prefs)
        setError("Failed to save preference. Please try again.")
      }
    })
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.4), transparent)" }}
        aria-hidden
      />

      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: "rgba(196,28,53,0.12)", border: "1px solid rgba(196,28,53,0.2)" }}
        >
          <Bell className="h-3.5 w-3.5" style={{ color: "rgba(196,28,53,0.9)" }} />
        </div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-foreground">
          Email Notifications
        </h2>
      </div>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {LABELS.map(({ key, label, description }, i) => (
          <div
            key={key}
            className="flex items-start justify-between gap-4 px-6 py-4"
            style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.04)" } : undefined}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              disabled={isPending}
              onClick={() => toggle(key)}
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: prefs[key]
                  ? "linear-gradient(135deg, rgba(196,28,53,0.85), rgba(59,130,246,0.7))"
                  : "rgba(255,255,255,0.08)",
              }}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg",
                  "ring-0 transition duration-200 ease-in-out",
                  prefs[key] ? "translate-x-4" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="px-6 py-3 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
