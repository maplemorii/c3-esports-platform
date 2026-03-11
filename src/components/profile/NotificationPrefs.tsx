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
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Email Notifications
        </h2>
      </div>

      <div className="divide-y divide-border">
        {LABELS.map(({ key, label, description }) => (
          <div key={key} className="flex items-start justify-between gap-4 p-5">
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
              className={[
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                "transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                prefs[key] ? "bg-blue-600" : "bg-muted",
              ].join(" ")}
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
        <p className="px-6 pb-4 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
