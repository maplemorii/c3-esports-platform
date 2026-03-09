"use client"

/**
 * SeasonCreateForm
 *
 * Staff-only form to create a new season via POST /api/seasons.
 * On success, redirects to the admin season detail page.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface FormState {
  name:              string
  startDate:         string
  endDate:           string
  registrationStart: string
  registrationEnd:   string
  leagueWeeks:       number
  isVisible:         boolean
}

const INITIAL: FormState = {
  name:              "",
  startDate:         "",
  endDate:           "",
  registrationStart: "",
  registrationEnd:   "",
  leagueWeeks:       8,
  isVisible:         false,
}

interface FieldProps {
  label:    string
  required?: boolean
  children: React.ReactNode
  hint?:    string
  error?:   string
}

function Field({ label, required, children, hint, error }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint  && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const INPUT_CLS = cn(
  "rounded-lg border border-border bg-card px-3 py-2 text-sm",
  "placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60",
  "transition-colors disabled:opacity-50"
)

export function SeasonCreateForm() {
  const router = useRouter()
  const [form, setForm]   = useState<FormState>(INITIAL)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Build payload — only include date fields if set
    const payload: Record<string, unknown> = {
      name:        form.name.trim(),
      leagueWeeks: form.leagueWeeks,
      isVisible:   form.isVisible,
    }
    if (form.startDate)         payload.startDate         = new Date(form.startDate).toISOString()
    if (form.endDate)           payload.endDate           = new Date(form.endDate).toISOString()
    if (form.registrationStart) payload.registrationStart = new Date(form.registrationStart).toISOString()
    if (form.registrationEnd)   payload.registrationEnd   = new Date(form.registrationEnd).toISOString()

    try {
      const res = await fetch("/api/seasons", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body?.error ?? `HTTP ${res.status}`)
        return
      }
      router.push(`/admin/seasons/${body.id}`)
      router.refresh()
    } catch {
      setError("Unexpected error — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Name */}
      <Field label="Season Name" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. C3 Season 4"
          required
          disabled={saving}
          className={INPUT_CLS}
        />
      </Field>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Season Start Date">
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            disabled={saving}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Season End Date">
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            disabled={saving}
            className={INPUT_CLS}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Registration Opens">
          <input
            type="datetime-local"
            value={form.registrationStart}
            onChange={(e) => set("registrationStart", e.target.value)}
            disabled={saving}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Registration Closes">
          <input
            type="datetime-local"
            value={form.registrationEnd}
            onChange={(e) => set("registrationEnd", e.target.value)}
            disabled={saving}
            className={INPUT_CLS}
          />
        </Field>
      </div>

      {/* League weeks */}
      <Field
        label="Number of Regular-Season Weeks"
        hint="Weeks are auto-generated from the season start date."
      >
        <input
          type="number"
          min={1}
          max={52}
          value={form.leagueWeeks}
          onChange={(e) => set("leagueWeeks", parseInt(e.target.value, 10) || 8)}
          disabled={saving}
          className={cn(INPUT_CLS, "w-24")}
        />
      </Field>

      {/* Visibility */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={form.isVisible}
          onChange={(e) => set("isVisible", e.target.checked)}
          disabled={saving}
          className="h-4 w-4 rounded border-border accent-brand"
        />
        <span className="text-sm font-medium">
          Publish immediately
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (visible to all users on the public seasons page)
          </span>
        </span>
      </label>

      {/* Note about divisions */}
      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        Three standard divisions (Premier, Open Challengers, Open Contenders) will be created automatically.
      </p>

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className={cn(
            "rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors",
            "hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {saving ? "Creating…" : "Create Season"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
