"use client"

/**
 * StaffMatchActions
 *
 * Match action buttons for staff/admin use on the match detail page.
 * Actions: Force check-in, Score override, Forfeit, Cancel.
 * Each destructive action uses an inline confirmation dialog.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  UserCheck,
  Trophy,
  Flag,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CalendarClock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MatchScheduleForm } from "./MatchScheduleForm"
import { DestructiveButton } from "@/components/ui/destructive-button"
import type { MatchStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Team = { id: string; name: string }

export type StaffMatchActionsProps = {
  matchId: string
  status: MatchStatus
  homeTeam: Team
  awayTeam: Team
  homeCheckedIn: boolean
  awayCheckedIn: boolean
  scheduledAt?: string | null
  notes?: string | null
}

type GameRow = { gameNumber: number; homeGoals: string; awayGoals: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TERMINAL: MatchStatus[] = ["COMPLETED", "CANCELLED", "FORFEITED", "NO_SHOW"]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionButton({
  label,
  icon: Icon,
  open,
  onToggle,
  disabled,
  variant = "default",
}: {
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  open: boolean
  onToggle: () => void
  disabled?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium rounded-lg border transition-colors",
        variant === "destructive"
          ? "border-destructive/30 text-destructive hover:bg-destructive/5"
          : "border-border text-foreground hover:bg-muted/30",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Force check-in panel
// ---------------------------------------------------------------------------

function ForceCheckInPanel({
  matchId,
  homeTeam,
  awayTeam,
  homeCheckedIn,
  awayCheckedIn,
}: {
  matchId: string
  homeTeam: Team
  awayTeam: Team
  homeCheckedIn: boolean
  awayCheckedIn: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  async function forceCheckIn(teamId: string) {
    setLoading(teamId)
    setError(null)
    try {
      const res = await fetch(`/api/matches/${matchId}/checkin/override`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ teamId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Check-in failed.")
        return
      }
      router.refresh()
    } catch {
      setError("Network error.")
    } finally {
      setLoading(null)
    }
  }

  const teams = [
    { team: homeTeam, checkedIn: homeCheckedIn },
    { team: awayTeam, checkedIn: awayCheckedIn },
  ]

  return (
    <div className="mt-2 space-y-3 p-4 rounded-lg border border-border bg-muted/20">
      <p className="text-xs text-muted-foreground">
        Force check-in a team even if they haven&apos;t done so themselves.
      </p>
      <div className="flex gap-2 flex-wrap">
        {teams.map(({ team, checkedIn }) => (
          <button
            key={team.id}
            onClick={() => forceCheckIn(team.id)}
            disabled={checkedIn || !!loading}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              checkedIn
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                : "bg-brand/10 text-brand border border-brand/30 hover:bg-brand/20 disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {loading === team.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" />
            )}
            {team.name} {checkedIn && "✓"}
          </button>
        ))}
      </div>
      {error && <ErrorBanner message={error} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score override panel
// ---------------------------------------------------------------------------

function ScoreOverridePanel({
  matchId,
  homeTeam,
  awayTeam,
}: {
  matchId: string
  homeTeam: Team
  awayTeam: Team
}) {
  const router = useRouter()
  const [games, setGames] = useState<GameRow[]>([
    { gameNumber: 1, homeGoals: "", awayGoals: "" },
  ])
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function addGame() {
    setGames((g) => [...g, { gameNumber: g.length + 1, homeGoals: "", awayGoals: "" }])
  }

  function removeGame(index: number) {
    setGames((g) => g.filter((_, i) => i !== index).map((row, i) => ({ ...row, gameNumber: i + 1 })))
  }

  function updateGame(index: number, field: "homeGoals" | "awayGoals", value: string) {
    setGames((g) => g.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  async function submit() {
    if (!reason.trim()) { setError("Reason is required."); return }

    const parsedGames = games.map((g, i) => {
      const h = parseInt(g.homeGoals, 10)
      const a = parseInt(g.awayGoals, 10)
      if (isNaN(h) || isNaN(a)) throw new Error(`Game ${i + 1}: goals must be numbers.`)
      if (h === a) throw new Error(`Game ${i + 1}: draws are not allowed.`)
      return { gameNumber: g.gameNumber, homeGoals: h, awayGoals: a }
    })

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matches/${matchId}/result`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ games: parsedGames, reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? JSON.stringify(data))
        return
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Manually set match scores. Each game must have a clear winner — no draws.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Score table */}
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[3rem_1fr_auto_1fr_2rem] items-center gap-0 bg-muted/30 border-b border-border px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">G</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate pr-2">{homeTeam.name}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 px-2">VS</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate pl-2">{awayTeam.name}</span>
            <span />
          </div>

          {/* Game rows */}
          <div className="divide-y divide-border">
            {games.map((game, i) => (
              <div key={i} className="grid grid-cols-[3rem_1fr_auto_1fr_2rem] items-center gap-0 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">G{game.gameNumber}</span>
                <input
                  type="number"
                  min="0"
                  value={game.homeGoals}
                  onChange={(e) => updateGame(i, "homeGoals", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-semibold text-center focus:outline-none focus:ring-1 focus:ring-brand/60 focus:border-brand/60 mr-2"
                />
                <span className="text-xs text-muted-foreground/40 font-medium px-2">—</span>
                <input
                  type="number"
                  min="0"
                  value={game.awayGoals}
                  onChange={(e) => updateGame(i, "awayGoals", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-semibold text-center focus:outline-none focus:ring-1 focus:ring-brand/60 focus:border-brand/60 ml-2"
                />
                <button
                  onClick={() => removeGame(i)}
                  disabled={games.length === 1}
                  className="flex items-center justify-end text-muted-foreground/30 hover:text-destructive disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Add game row */}
          {games.length < 7 && (
            <div className="border-t border-border">
              <button
                onClick={addGame}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/20 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add game
              </button>
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Reason <span className="text-destructive">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Correcting scores from uploaded replays — teams agreed on outcome."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand/60 focus:border-brand/60 resize-none"
          />
        </div>

        {error && <ErrorBanner message={error} />}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
          Submit Override
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Forfeit panel
// ---------------------------------------------------------------------------

function ForfeitPanel({
  matchId,
  homeTeam,
  awayTeam,
}: {
  matchId: string
  homeTeam: Team
  awayTeam: Team
}) {
  const router = useRouter()
  const [forfeitingTeamId, setForfeitingTeamId] = useState("")
  const [reason, setReason]   = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  async function submit() {
    if (!forfeitingTeamId) { setError("Select the forfeiting team."); return }
    if (!reason.trim())    { setError("Reason is required."); return }
    if (!confirmed)        { setError("Please confirm this action."); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matches/${matchId}/forfeit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ forfeitingTeamId, reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Forfeit failed.")
        return
      }
      router.refresh()
    } catch {
      setError("Network error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 space-y-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
      <p className="text-xs text-muted-foreground">
        Record a forfeit. The non-forfeiting team will be awarded the win.
      </p>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Forfeiting Team
        </label>
        <div className="flex gap-2">
          {[homeTeam, awayTeam].map((t) => (
            <button
              key={t.id}
              onClick={() => setForfeitingTeamId(t.id)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                forfeitingTeamId === t.id
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border bg-background hover:bg-muted/30",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reason <span className="text-destructive">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="e.g. Team did not show up within the forfeit window."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="rounded border-border"
        />
        <span className="text-xs text-muted-foreground">
          I confirm this forfeit is correct and standings will be updated.
        </span>
      </label>

      {error && <ErrorBanner message={error} />}

      <DestructiveButton onClick={submit} disabled={loading}>
        {loading ? <><Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1.5" />Recording…</> : "Record Forfeit"}
      </DestructiveButton>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cancel panel
// ---------------------------------------------------------------------------

function CancelPanel({ matchId }: { matchId: string }) {
  const router = useRouter()
  const [reason, setReason]   = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  async function submit() {
    if (!confirmed) { setError("Please confirm this action."); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason: reason.trim() || "Cancelled by staff" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Cancel failed.")
        return
      }
      router.push("/admin/matches")
    } catch {
      setError("Network error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 space-y-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
      <p className="text-xs text-muted-foreground">
        Cancel this match permanently. This cannot be undone.
      </p>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reason (optional)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Scheduling conflict — match will not be replayed."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="rounded border-border"
        />
        <span className="text-xs text-muted-foreground">
          I confirm I want to permanently cancel this match.
        </span>
      </label>

      {error && <ErrorBanner message={error} />}

      <DestructiveButton onClick={submit} disabled={loading}>
        {loading ? <><Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1.5" />Cancelling…</> : "Cancel Match"}
      </DestructiveButton>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StaffMatchActions({
  matchId,
  status,
  homeTeam,
  awayTeam,
  homeCheckedIn,
  awayCheckedIn,
  scheduledAt,
  notes,
}: StaffMatchActionsProps) {
  const [openPanel, setOpenPanel] = useState<"checkin" | "score" | "forfeit" | "cancel" | "reschedule" | null>(null)

  const toggle = (panel: typeof openPanel) =>
    setOpenPanel((p) => (p === panel ? null : panel))

  const isTerminal = TERMINAL.includes(status)

  if (isTerminal) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span>Match is <strong>{status.toLowerCase()}</strong> — no further actions available.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Staff Actions
      </h2>

      {/* Force check-in */}
      <div>
        <SectionButton
          label="Force Check-In"
          icon={UserCheck}
          open={openPanel === "checkin"}
          onToggle={() => toggle("checkin")}
          disabled={status !== "CHECKING_IN"}
        />
        {openPanel === "checkin" && (
          <ForceCheckInPanel
            matchId={matchId}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeCheckedIn={homeCheckedIn}
            awayCheckedIn={awayCheckedIn}
          />
        )}
      </div>

      {/* Reschedule */}
      <div>
        <SectionButton
          label="Reschedule"
          icon={CalendarClock}
          open={openPanel === "reschedule"}
          onToggle={() => toggle("reschedule")}
        />
        {openPanel === "reschedule" && (
          <div className="mt-2 p-4 rounded-lg border border-border bg-muted/20">
            <MatchScheduleForm
              mode="reschedule"
              matchId={matchId}
              currentScheduledAt={scheduledAt}
              currentNotes={notes}
              onSuccess={() => {
                setOpenPanel(null)
              }}
            />
          </div>
        )}
      </div>

      {/* Score override */}
      <div>
        <SectionButton
          label="Override Score"
          icon={Trophy}
          open={openPanel === "score"}
          onToggle={() => toggle("score")}
        />
        {openPanel === "score" && (
          <ScoreOverridePanel
            matchId={matchId}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        )}
      </div>

      {/* Forfeit */}
      <div>
        <SectionButton
          label="Record Forfeit"
          icon={Flag}
          open={openPanel === "forfeit"}
          onToggle={() => toggle("forfeit")}
          variant="destructive"
        />
        {openPanel === "forfeit" && (
          <ForfeitPanel
            matchId={matchId}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        )}
      </div>

      {/* Cancel */}
      <div>
        <SectionButton
          label="Cancel Match"
          icon={XCircle}
          open={openPanel === "cancel"}
          onToggle={() => toggle("cancel")}
          variant="destructive"
        />
        {openPanel === "cancel" && <CancelPanel matchId={matchId} />}
      </div>
    </div>
  )
}
