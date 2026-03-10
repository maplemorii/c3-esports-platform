"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TeamInfo = {
  id: string
  name: string
  logoUrl: string | null
  primaryColor: string | null
}

type LockedGame = {
  gameNumber: number
  homeGoals: number
  awayGoals: number
  overtime: boolean
}

type GameEntry = {
  homeGoals: string
  awayGoals: string
  overtime: boolean
}

type Props = {
  matchId: string
  gamesExpected: number
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  lockedGames: LockedGame[]
  lockedGameNums: number[]
  preFill: Record<number, { homeGoals: number; awayGoals: number; overtime: boolean }>
  isStaff: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ScoreForm({
  matchId,
  gamesExpected,
  homeTeam,
  awayTeam,
  lockedGames,
  lockedGameNums,
  preFill,
  isStaff,
}: Props) {
  const router = useRouter()

  const lockedSet = new Set(lockedGameNums)

  // Initialise editable game state from preFill (excluding locked games)
  const [entries, setEntries] = useState<Record<number, GameEntry>>(() => {
    const init: Record<number, GameEntry> = {}
    for (let n = 1; n <= gamesExpected; n++) {
      if (lockedSet.has(n)) continue
      const pf = preFill[n]
      init[n] = pf
        ? { homeGoals: String(pf.homeGoals), awayGoals: String(pf.awayGoals), overtime: pf.overtime }
        : { homeGoals: "", awayGoals: "", overtime: false }
    }
    return init
  })

  const [staffReason, setStaffReason] = useState("")
  const [loading, setLoading]         = useState(false)
  const [apiError, setApiError]       = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  function parseGoals(val: string): number | null {
    const n = parseInt(val, 10)
    return isNaN(n) || n < 0 ? null : n
  }

  type FilledGame = { gameNumber: number; homeGoals: number; awayGoals: number; overtime: boolean }

  const filledGames: FilledGame[] = Object.entries(entries)
    .map(([num, e]) => ({
      gameNumber: Number(num),
      homeGoals:  parseGoals(e.homeGoals),
      awayGoals:  parseGoals(e.awayGoals),
      overtime:   e.overtime,
    }))
    .filter((g): g is FilledGame =>
      g.homeGoals !== null &&
      g.awayGoals !== null &&
      g.homeGoals !== g.awayGoals  // no draws
    )
    .sort((a, b) => a.gameNumber - b.gameNumber)

  // Combine locked + filled for series score
  const allScoredGames: FilledGame[] = [
    ...lockedGames,
    ...filledGames,
  ].sort((a, b) => a.gameNumber - b.gameNumber)

  const homeWins = allScoredGames.filter(g => g.homeGoals > g.awayGoals).length
  const awayWins = allScoredGames.filter(g => g.awayGoals > g.homeGoals).length

  // Validate: at least 1 filled game (not counting locked ones)
  const hasFilledGames = filledGames.length > 0 || lockedGames.length > 0
  const canSubmit = hasFilledGames && (!isStaff || staffReason.trim().length > 0)

  // Per-game validation errors shown inline
  function gameError(num: number): string | null {
    const e = entries[num]
    if (!e) return null
    const h = parseGoals(e.homeGoals)
    const a = parseGoals(e.awayGoals)
    if ((e.homeGoals !== "" || e.awayGoals !== "") && (h === null || a === null)) {
      return "Enter valid scores for both teams"
    }
    if (h !== null && a !== null && h === a) {
      return "Games cannot end in a draw"
    }
    return null
  }

  const hasErrors = Object.keys(entries).some(n => gameError(Number(n)) !== null)

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || hasErrors) return

    const allGames = [
      ...lockedGames.map(g => ({ gameNumber: g.gameNumber, homeGoals: g.homeGoals, awayGoals: g.awayGoals, overtime: g.overtime })),
      ...filledGames,
    ]

    setLoading(true)
    setApiError(null)

    try {
      const body: Record<string, unknown> = { games: allGames }
      if (isStaff) body.reason = staffReason

      const res = await fetch(`/api/matches/${matchId}/result`, {
        method:  isStaff ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setApiError(data.message ?? "Submission failed. Please try again.")
        return
      }

      router.push(`/matches/${matchId}`)
      router.refresh()
    } catch {
      setApiError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function setEntry(gameNum: number, field: keyof GameEntry, value: string | boolean) {
    setEntries(prev => ({
      ...prev,
      [gameNum]: { ...prev[gameNum], [field]: value },
    }))
  }

  function TeamBadge({ team }: { team: TeamInfo }) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="h-6 w-6 rounded shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
          style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
        >
          {team.logoUrl
            ? <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
            : team.name.slice(0, 2).toUpperCase()
          }
        </div>
        <span className="text-sm font-medium truncate">{team.name}</span>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Series score summary */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden"
            style={{ backgroundColor: homeTeam.primaryColor ?? "oklch(0.50 0.20 15)" }}
          >
            {homeTeam.logoUrl
              ? <img src={homeTeam.logoUrl} alt="" className="h-full w-full object-cover" />
              : homeTeam.name.slice(0, 2).toUpperCase()
            }
          </div>
          <span className="font-medium text-sm">{homeTeam.name}</span>
        </div>
        <div className="font-display font-black text-3xl tabular-nums flex items-baseline gap-3">
          <span className={cn(homeWins > awayWins ? "text-emerald-400" : "")}>{homeWins}</span>
          <span className="text-muted-foreground/40 text-xl">–</span>
          <span className={cn(awayWins > homeWins ? "text-emerald-400" : "")}>{awayWins}</span>
        </div>
        <div className="flex items-center gap-3 flex-row-reverse">
          <div
            className="h-8 w-8 rounded shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden"
            style={{ backgroundColor: awayTeam.primaryColor ?? "oklch(0.50 0.20 15)" }}
          >
            {awayTeam.logoUrl
              ? <img src={awayTeam.logoUrl} alt="" className="h-full w-full object-cover" />
              : awayTeam.name.slice(0, 2).toUpperCase()
            }
          </div>
          <span className="font-medium text-sm">{awayTeam.name}</span>
        </div>
      </div>

      {/* Game rows */}
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {/* Column headers */}
        <div className="grid grid-cols-[2rem_1fr_4rem_2rem_4rem_1fr] gap-3 items-center px-5 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span>#</span>
          <span>{homeTeam.name}</span>
          <span className="text-center">Score</span>
          <span />
          <span className="text-center">Score</span>
          <span className="text-right">{awayTeam.name}</span>
        </div>

        {Array.from({ length: gamesExpected }, (_, i) => i + 1).map((gameNum) => {
          const isLocked = lockedSet.has(gameNum)
          const locked   = lockedGames.find(g => g.gameNumber === gameNum)
          const entry    = entries[gameNum]
          const err      = gameError(gameNum)

          return (
            <div key={gameNum} className={cn("px-5 py-3", isLocked && "bg-muted/20")}>
              <div className="grid grid-cols-[2rem_1fr_4rem_2rem_4rem_1fr] gap-3 items-center">
                {/* Game number */}
                <span className="text-sm font-display font-black tabular-nums text-muted-foreground/40">
                  {gameNum}
                </span>

                {/* Home team label */}
                <TeamBadge team={homeTeam} />

                {/* Home goals */}
                {isLocked && locked ? (
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-display font-bold tabular-nums">{locked.homeGoals}</span>
                    <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  </div>
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={entry?.homeGoals ?? ""}
                    onChange={e => setEntry(gameNum, "homeGoals", e.target.value)}
                    placeholder="—"
                    className={cn(
                      "w-full rounded-md border bg-background px-2 py-1.5 text-center text-lg font-display font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/50",
                      err ? "border-destructive" : "border-border",
                    )}
                  />
                )}

                {/* OT badge / VS divider */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs text-muted-foreground/40 font-bold">–</span>
                  {isLocked && locked?.overtime && (
                    <span className="text-[9px] font-semibold text-amber-400 uppercase">OT</span>
                  )}
                  {!isLocked && entry && (
                    <label className="flex items-center gap-0.5 cursor-pointer" title="Overtime">
                      <input
                        type="checkbox"
                        checked={entry.overtime}
                        onChange={e => setEntry(gameNum, "overtime", e.target.checked)}
                        className="h-2.5 w-2.5 rounded-sm accent-amber-400"
                      />
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">OT</span>
                    </label>
                  )}
                </div>

                {/* Away goals */}
                {isLocked && locked ? (
                  <div className="flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    <span className="text-lg font-display font-bold tabular-nums">{locked.awayGoals}</span>
                  </div>
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={entry?.awayGoals ?? ""}
                    onChange={e => setEntry(gameNum, "awayGoals", e.target.value)}
                    placeholder="—"
                    className={cn(
                      "w-full rounded-md border bg-background px-2 py-1.5 text-center text-lg font-display font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/50",
                      err ? "border-destructive" : "border-border",
                    )}
                  />
                )}

                {/* Away team label */}
                <div className="flex justify-end">
                  <TeamBadge team={awayTeam} />
                </div>
              </div>

              {/* Inline error */}
              {err && (
                <p className="mt-1.5 text-xs text-destructive">{err}</p>
              )}

              {/* Locked badge */}
              {isLocked && (
                <p className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Locked — sourced from verified replay
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Staff reason (PATCH override) */}
      {isStaff && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Staff Override Reason <span className="text-destructive">*</span>
          </label>
          <textarea
            value={staffReason}
            onChange={e => setStaffReason(e.target.value)}
            rows={2}
            placeholder="Reason for staff score override…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
          />
        </div>
      )}

      {/* API error */}
      {apiError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {apiError}
        </p>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || !canSubmit || hasErrors}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Trophy className="h-4 w-4" />
          }
          {isStaff ? "Override Scores (Staff)" : "Submit Scores"}
        </button>

        {!isStaff && (
          <p className="text-xs text-muted-foreground">
            The opposing team will be asked to confirm your submission.
          </p>
        )}
      </div>

    </form>
  )
}
