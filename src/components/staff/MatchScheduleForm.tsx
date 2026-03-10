"use client"

/**
 * MatchScheduleForm
 *
 * Two modes:
 *   - create: full form (division → teams, format, type, scheduledAt, notes)
 *             POSTs to /api/matches
 *   - reschedule: just scheduledAt + notes
 *                 PATCHes /api/matches/:matchId
 *
 * On success calls `onSuccess(matchId)` so the parent can redirect or refresh.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MatchFormat, MatchType } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Division = { id: string; name: string; tier: string; season: { name: string } }
type Team     = { id: string; name: string; slug: string }
type Week     = { id: string; weekNumber: number; startDate: string; endDate: string }

export type MatchScheduleFormProps =
  | {
      mode: "create"
      onSuccess?: (matchId: string) => void
      /** Pre-select a division (e.g. coming from season hub) */
      defaultDivisionId?: string
    }
  | {
      mode: "reschedule"
      matchId: string
      currentScheduledAt?: string | null
      currentNotes?: string | null
      onSuccess?: () => void
    }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FORMAT_OPTIONS: { value: MatchFormat; label: string }[] = [
  { value: "BO1", label: "Best of 1" },
  { value: "BO3", label: "Best of 3" },
  { value: "BO5", label: "Best of 5" },
  { value: "BO7", label: "Best of 7" },
]

const TYPE_OPTIONS: { value: MatchType; label: string }[] = [
  { value: "REGULAR_SEASON", label: "Regular Season" },
  { value: "PLAYOFF",        label: "Playoff" },
  { value: "BRACKET",        label: "Bracket" },
  { value: "FRIENDLY",       label: "Friendly (no standings)" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a local datetime-local value to an ISO 8601 offset string */
function localToIso(localStr: string): string {
  if (!localStr) return ""
  const d = new Date(localStr)
  if (isNaN(d.getTime())) return ""
  return d.toISOString()
}

/** Convert an ISO string to the value used by datetime-local input */
function isoToLocal(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  // "YYYY-MM-DDTHH:MM"
  return iso.slice(0, 16)
}

// ---------------------------------------------------------------------------
// Create form
// ---------------------------------------------------------------------------

function CreateForm({ defaultDivisionId, onSuccess }: {
  defaultDivisionId?: string
  onSuccess?: (matchId: string) => void
}) {
  const router = useRouter()

  const [divisions, setDivisions]   = useState<Division[]>([])
  const [teams, setTeams]           = useState<Team[]>([])
  const [weeks, setWeeks]           = useState<Week[]>([])
  const [loadingDivisions, setLoadingDivisions] = useState(true)
  const [loadingTeams, setLoadingTeams]         = useState(false)

  const [divisionId, setDivisionId] = useState(defaultDivisionId ?? "")
  const [homeTeamId, setHomeTeamId] = useState("")
  const [awayTeamId, setAwayTeamId] = useState("")
  const [format, setFormat]         = useState<MatchFormat>("BO3")
  const [matchType, setMatchType]   = useState<MatchType>("REGULAR_SEASON")
  const [leagueWeekId, setLeagueWeekId] = useState("")
  const [scheduledAt, setScheduledAt]   = useState("")
  const [notes, setNotes]               = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Load divisions on mount
  useEffect(() => {
    fetch("/api/seasons?status=ACTIVE&limit=5")
      .then((r) => r.json())
      .then((data) => {
        const seasons: { divisions?: Division[] }[] = data.seasons ?? []
        const allDivisions: Division[] = seasons.flatMap((s: { divisions?: Division[] }) => s.divisions ?? [])
        if (allDivisions.length === 0) {
          // Fallback — fetch all seasons
          return fetch("/api/seasons?limit=10")
            .then((r) => r.json())
            .then((d) => {
              const divs: Division[] = (d.seasons ?? []).flatMap((s: { divisions?: Division[] }) => s.divisions ?? [])
              setDivisions(divs)
              if (!defaultDivisionId && divs.length > 0) setDivisionId(divs[0].id)
            })
        }
        setDivisions(allDivisions)
        if (!defaultDivisionId && allDivisions.length > 0) setDivisionId(allDivisions[0].id)
      })
      .catch(() => setError("Failed to load divisions."))
      .finally(() => setLoadingDivisions(false))
  }, [defaultDivisionId])

  // Load teams and weeks when division changes
  useEffect(() => {
    if (!divisionId) { setTeams([]); setWeeks([]); return }
    setLoadingTeams(true)
    setHomeTeamId("")
    setAwayTeamId("")
    setLeagueWeekId("")

    // Find the seasonId from the selected division
    const div = divisions.find((d) => d.id === divisionId)

    // Fetch approved registrations for this division to get teams
    Promise.all([
      fetch(`/api/matches?divisionId=${divisionId}&limit=1`)
        .then((r) => r.json())
        .then(() => {
          // We need teams registered to this division — fetch via seasons registrations
          // Actually we just need teams via standings or we can use the division's standingEntries
          // Use a different approach: get teams from the division directly
          return fetch(`/api/seasons?limit=20`)
            .then((r) => r.json())
        }),
    ])
      .catch(() => null)
      .finally(() => setLoadingTeams(false))
    // Fetch weeks if we have season info
    if (div) {
      // Get seasonId from divisions list — need to enhance: add seasonId to division type
      // For now, find season from active seasons
    }
    setLoadingTeams(false)
  }, [divisionId, divisions])

  // Better teams loading: use standings entries (teams that are in the division)
  useEffect(() => {
    if (!divisionId) return
    setLoadingTeams(true)
    fetch(`/api/divisions/${divisionId}/standings`)
      .then((r) => r.json())
      .then((data) => {
        const standingTeams: Team[] = (data.standings ?? []).map((s: { team: Team }) => s.team)
        setTeams(standingTeams)
      })
      .catch(() => setTeams([]))
      .finally(() => setLoadingTeams(false))
  }, [divisionId])

  async function submit() {
    if (!divisionId)  { setError("Select a division."); return }
    if (!homeTeamId)  { setError("Select the home team."); return }
    if (!awayTeamId)  { setError("Select the away team."); return }
    if (homeTeamId === awayTeamId) { setError("Home and away teams must be different."); return }

    setSubmitting(true)
    setError(null)

    const body: Record<string, unknown> = {
      divisionId,
      homeTeamId,
      awayTeamId,
      format,
      matchType,
      ...(leagueWeekId && { leagueWeekId }),
      ...(scheduledAt && { scheduledAt: localToIso(scheduledAt) }),
      ...(notes.trim() && { notes: notes.trim() }),
    }

    try {
      const res = await fetch("/api/matches", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error ?? "Failed to create match."))
        return
      }

      const match = await res.json()
      if (onSuccess) {
        onSuccess(match.id)
      } else {
        router.push(`/admin/matches/${match.id}`)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Division */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Division <span className="text-destructive">*</span>
        </label>
        {loadingDivisions ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading divisions…
          </div>
        ) : (
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="">Select a division…</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.season.name} · {d.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Home Team <span className="text-destructive">*</span>
          </label>
          <select
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            disabled={!divisionId || loadingTeams}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
          >
            <option value="">{loadingTeams ? "Loading…" : "Select home team…"}</option>
            {teams.filter((t) => t.id !== awayTeamId).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Away Team <span className="text-destructive">*</span>
          </label>
          <select
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
            disabled={!divisionId || loadingTeams}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
          >
            <option value="">{loadingTeams ? "Loading…" : "Select away team…"}</option>
            {teams.filter((t) => t.id !== homeTeamId).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Format + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as MatchFormat)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            {FORMAT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Match Type
          </label>
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value as MatchType)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            {TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scheduled at */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Scheduled At (optional)
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Rescheduled from Week 3 due to scheduling conflict."
          maxLength={500}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
        {submitting ? "Scheduling…" : "Schedule Match"}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reschedule form
// ---------------------------------------------------------------------------

function RescheduleForm({ matchId, currentScheduledAt, currentNotes, onSuccess }: {
  matchId: string
  currentScheduledAt?: string | null
  currentNotes?: string | null
  onSuccess?: () => void
}) {
  const router = useRouter()

  const [scheduledAt, setScheduledAt] = useState(
    currentScheduledAt ? isoToLocal(currentScheduledAt) : ""
  )
  const [notes, setNotes]     = useState(currentNotes ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function submit() {
    if (!scheduledAt) { setError("Scheduled date/time is required."); return }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          scheduledAt: localToIso(scheduledAt),
          ...(notes.trim() && { notes: notes.trim() }),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Failed to reschedule match.")
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          New Date / Time <span className="text-destructive">*</span>
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Rescheduled due to scheduling conflict."
          maxLength={500}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white",
          "hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        )}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
        {submitting ? "Saving…" : "Save Schedule"}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export function MatchScheduleForm(props: MatchScheduleFormProps) {
  if (props.mode === "reschedule") {
    return (
      <RescheduleForm
        matchId={props.matchId}
        currentScheduledAt={props.currentScheduledAt}
        currentNotes={props.currentNotes}
        onSuccess={props.onSuccess}
      />
    )
  }

  return (
    <CreateForm
      defaultDivisionId={props.defaultDivisionId}
      onSuccess={props.onSuccess}
    />
  )
}
