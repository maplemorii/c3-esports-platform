"use client"

/**
 * SeasonEditForm
 *
 * Staff-only form to edit an existing season via PATCH /api/seasons/:seasonId.
 * Loaded with existing season data from the server.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { SeasonStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeasonData {
  id:                   string
  name:                 string
  slug:                 string
  status:               SeasonStatus
  description:          string | null
  isVisible:            boolean
  startDate:            string | null
  endDate:              string | null
  registrationStart:    string | null
  registrationEnd:      string | null
  rosterLockAt:         string | null
  leagueWeeks:          number
  checkInWindowMinutes: number
  checkInGraceMinutes:  number
  resultWindowHours:    number
  maxTeamsTotal:        number | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a date string/Date to datetime-local input value (UTC). */
function toLocal(d: string | null | undefined): string {
  if (!d) return ""
  return new Date(d).toISOString().slice(0, 16)
}

const STATUSES: SeasonStatus[] = [
  "DRAFT", "REGISTRATION", "ACTIVE", "PLAYOFFS", "COMPLETED", "CANCELLED",
]

const STATUS_HINTS: Partial<Record<SeasonStatus, string>> = {
  REGISTRATION: "Teams can now register. Make sure isVisible is also on.",
  ACTIVE:       "Regular season matches will be played. Only one season can be ACTIVE at a time.",
  COMPLETED:    "Season is archived. Results are locked.",
  CANCELLED:    "Season is cancelled and hidden from public view.",
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FieldProps {
  label:    string
  hint?:    string
  children: React.ReactNode
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const INPUT_CLS = cn(
  "rounded-lg border border-border bg-card px-3 py-2 text-sm",
  "placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60",
  "transition-colors disabled:opacity-50"
)

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function SeasonEditForm({ season }: { season: SeasonData }) {
  const router = useRouter()

  const [status,               setStatus]               = useState<SeasonStatus>(season.status)
  const [isVisible,            setIsVisible]            = useState(season.isVisible)
  const [name,                 setName]                 = useState(season.name)
  const [description,          setDescription]          = useState(season.description ?? "")
  const [startDate,            setStartDate]            = useState(toLocal(season.startDate))
  const [endDate,              setEndDate]              = useState(toLocal(season.endDate))
  const [registrationStart,    setRegistrationStart]    = useState(toLocal(season.registrationStart))
  const [registrationEnd,      setRegistrationEnd]      = useState(toLocal(season.registrationEnd))
  const [rosterLockAt,         setRosterLockAt]         = useState(toLocal(season.rosterLockAt))
  const [leagueWeeks,          setLeagueWeeks]          = useState(season.leagueWeeks)
  const [checkInWindow,        setCheckInWindow]        = useState(season.checkInWindowMinutes)
  const [checkInGrace,         setCheckInGrace]         = useState(season.checkInGraceMinutes)
  const [resultWindow,         setResultWindow]         = useState(season.resultWindowHours)
  const [maxTeams,             setMaxTeams]             = useState(season.maxTeamsTotal?.toString() ?? "")

  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setApiError(null)

    const payload: Record<string, unknown> = {
      name:                 name.trim(),
      description:          description.trim() || undefined,
      status,
      isVisible,
      leagueWeeks,
      checkInWindowMinutes: checkInWindow,
      checkInGraceMinutes:  checkInGrace,
      resultWindowHours:    resultWindow,
      maxTeamsTotal:        maxTeams ? parseInt(maxTeams, 10) : undefined,
    }
    if (startDate)         payload.startDate         = new Date(startDate).toISOString()
    if (endDate)           payload.endDate           = new Date(endDate).toISOString()
    if (registrationStart) payload.registrationStart = new Date(registrationStart).toISOString()
    if (registrationEnd)   payload.registrationEnd   = new Date(registrationEnd).toISOString()
    if (rosterLockAt)      payload.rosterLockAt      = new Date(rosterLockAt).toISOString()
    else                   payload.rosterLockAt      = null

    try {
      const res = await fetch(`/api/seasons/${season.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setApiError(body?.error ?? `HTTP ${res.status}`)
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setApiError("Unexpected error — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Status & Visibility ─────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Status &amp; Visibility
        </h2>

        <Field label="Season Status" hint={STATUS_HINTS[status]}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SeasonStatus)}
            disabled={saving}
            className={INPUT_CLS}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-border accent-brand"
          />
          <span className="text-sm font-medium">
            Visible to public
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (shows on the public seasons page)
            </span>
          </span>
        </label>
      </section>

      {/* ── Basic Info ──────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Basic Info
        </h2>

        <Field label="Season Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            required
            className={INPUT_CLS}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={saving}
            placeholder="Optional short description shown on the public page."
            className={cn(INPUT_CLS, "resize-none")}
          />
        </Field>
      </section>

      {/* ── Dates ───────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Dates
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Season Start">
            <input type="datetime-local" value={startDate}         onChange={(e) => setStartDate(e.target.value)}         disabled={saving} className={INPUT_CLS} />
          </Field>
          <Field label="Season End">
            <input type="datetime-local" value={endDate}           onChange={(e) => setEndDate(e.target.value)}           disabled={saving} className={INPUT_CLS} />
          </Field>
          <Field label="Registration Opens">
            <input type="datetime-local" value={registrationStart} onChange={(e) => setRegistrationStart(e.target.value)} disabled={saving} className={INPUT_CLS} />
          </Field>
          <Field label="Registration Closes">
            <input type="datetime-local" value={registrationEnd}   onChange={(e) => setRegistrationEnd(e.target.value)}   disabled={saving} className={INPUT_CLS} />
          </Field>
          <Field label="Roster Lock" hint="After this time, approved teams cannot add or remove players. Leave blank for no lock.">
            <input type="datetime-local" value={rosterLockAt}      onChange={(e) => setRosterLockAt(e.target.value)}      disabled={saving} className={INPUT_CLS} />
          </Field>
        </div>
      </section>

      {/* ── League Config ───────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          League Config
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Regular-Season Weeks">
            <input type="number" min={1} max={52} value={leagueWeeks}   onChange={(e) => setLeagueWeeks(parseInt(e.target.value, 10) || 8)}  disabled={saving} className={cn(INPUT_CLS, "w-28")} />
          </Field>
          <Field label="Max Teams (total)" hint="Leave blank for unlimited.">
            <input type="number" min={1} max={512} value={maxTeams}     onChange={(e) => setMaxTeams(e.target.value)}                        disabled={saving} className={cn(INPUT_CLS, "w-28")} placeholder="∞" />
          </Field>
          <Field label="Check-in Window (min)" hint="How long before match start check-in opens.">
            <input type="number" min={1} max={60}  value={checkInWindow} onChange={(e) => setCheckInWindow(parseInt(e.target.value, 10) || 15)} disabled={saving} className={cn(INPUT_CLS, "w-28")} />
          </Field>
          <Field label="Check-in Grace Period (min)" hint="Extra time after match start before forfeiting.">
            <input type="number" min={0} max={60}  value={checkInGrace}  onChange={(e) => setCheckInGrace(parseInt(e.target.value, 10) || 0)}  disabled={saving} className={cn(INPUT_CLS, "w-28")} />
          </Field>
          <Field label="Result Window (hours)" hint="How long teams have to submit results after match.">
            <input type="number" min={1} max={168} value={resultWindow}  onChange={(e) => setResultWindow(parseInt(e.target.value, 10) || 24)}  disabled={saving} className={cn(INPUT_CLS, "w-28")} />
          </Field>
        </div>
      </section>

      {/* Feedback */}
      {saved && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Season saved successfully.
        </p>
      )}
      {apiError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {apiError}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className={cn(
            "rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors",
            "hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

    </form>
  )
}
