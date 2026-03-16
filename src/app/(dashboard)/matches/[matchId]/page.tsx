/**
 * /(dashboard)/matches/[matchId]
 *
 * Match detail page — hero with game badges, team stat bars, per-player
 * stat cards, replay upload slots, and contextual action buttons.
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  FileText,
  Shield,
  Swords,
  Upload,
  ExternalLink,
} from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { hasMinRole } from "@/lib/roles"
import { cn } from "@/lib/utils"
import type { MatchStatus, ReplayParseStatus } from "@prisma/client"
import CheckInButton from "./_components/CheckInButton"
import ConfirmButton from "./_components/ConfirmButton"
import ReplayUploader from "./_components/ReplayUploader"

export const metadata: Metadata = { title: "Match Details" }

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getMatch(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId, deletedAt: null },
    select: {
      id: true,
      status: true,
      format: true,
      matchType: true,
      scheduledAt: true,
      checkInOpenAt: true,
      checkInDeadlineAt: true,
      resultDeadlineAt: true,
      completedAt: true,
      homeScore: true,
      awayScore: true,
      gamesExpected: true,
      replaysVerified: true,
      submittedByTeamId: true,
      submittedAt: true,
      confirmedByTeamId: true,
      confirmedAt: true,
      homeTeam: {
        select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
      },
      awayTeam: {
        select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
      },
      winner: { select: { id: true, name: true } },
      division: {
        select: {
          id: true,
          name: true,
          tier: true,
          season: { select: { id: true, name: true, slug: true } },
        },
      },
      leagueWeek: { select: { id: true, weekNumber: true } },
      checkIns: {
        select: { teamId: true, status: true, checkedInAt: true },
      },
      games: {
        orderBy: { gameNumber: "asc" },
        select: {
          id: true,
          gameNumber: true,
          homeGoals: true,
          awayGoals: true,
          overtime: true,
          source: true,
        },
      },
      replays: {
        orderBy: { gameNumber: "asc" },
        select: {
          id: true,
          gameNumber: true,
          parseStatus: true,
          parseError: true,
          ballchasingUrl: true,
          parsedHomeGoals: true,
          parsedAwayGoals: true,
          parsedOvertime: true,
          uploadedByTeamId: true,
          playerStats: {
            select: {
              epicUsername: true,
              teamSide: true,
              score: true,
              goals: true,
              assists: true,
              saves: true,
              shots: true,
              demos: true,
              player: { select: { id: true, displayName: true } },
            },
          },
        },
      },
      dispute: {
        select: { id: true, status: true, reason: true, resolvedAt: true },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlayerStatRow = {
  epicUsername: string
  teamSide: string
  score: number
  goals: number
  assists: number
  saves: number
  shots: number
  demos: number
  player: { id: string; displayName: string } | null
}

type AggregatedPlayer = {
  key: string
  name: string
  teamSide: string
  goals: number
  assists: number
  saves: number
  shots: number
  demos: number
  gamesPlayed: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<MatchStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  SCHEDULED:      { label: "Scheduled",      cls: "text-muted-foreground bg-muted border-transparent",         icon: <Clock className="h-3.5 w-3.5" /> },
  CHECKING_IN:    { label: "Check-In",       cls: "text-amber-400 bg-amber-400/10 border-amber-400/30",        icon: <Clock className="h-3.5 w-3.5" /> },
  IN_PROGRESS:    { label: "In Progress",    cls: "text-blue-400 bg-blue-400/10 border-blue-400/30",           icon: <Swords className="h-3.5 w-3.5" /> },
  MATCH_FINISHED: { label: "Match Finished", cls: "text-purple-400 bg-purple-400/10 border-purple-400/30",     icon: <Upload className="h-3.5 w-3.5" /> },
  VERIFYING:      { label: "Verifying",      cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",     icon: <Shield className="h-3.5 w-3.5" /> },
  COMPLETED:      { label: "Completed",      cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",  icon: <Trophy className="h-3.5 w-3.5" /> },
  DISPUTED:       { label: "Disputed",       cls: "text-red-400 bg-red-400/10 border-red-400/30",              icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  FORFEITED:      { label: "Forfeited",      cls: "text-muted-foreground bg-muted border-transparent",         icon: <XCircle className="h-3.5 w-3.5" /> },
  NO_SHOW:        { label: "No Show",        cls: "text-muted-foreground bg-muted border-transparent",         icon: <XCircle className="h-3.5 w-3.5" /> },
  CANCELLED:      { label: "Cancelled",      cls: "text-muted-foreground bg-muted border-transparent",         icon: <XCircle className="h-3.5 w-3.5" /> },
}

const FORMAT_LABEL: Record<string, string> = {
  BO1: "Best of 1", BO3: "Best of 3", BO5: "Best of 5", BO7: "Best of 7",
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    hour:    "numeric",
    minute:  "2-digit",
    hour12:  true,
  })
}

function aggregatePlayers(replays: { playerStats: PlayerStatRow[] }[]): AggregatedPlayer[] {
  const map = new Map<string, AggregatedPlayer>()
  for (const replay of replays) {
    for (const stat of replay.playerStats) {
      const key = stat.player?.id ?? stat.epicUsername
      const existing = map.get(key)
      if (existing) {
        existing.goals      += stat.goals
        existing.assists    += stat.assists
        existing.saves      += stat.saves
        existing.shots      += stat.shots
        existing.demos      += stat.demos
        existing.gamesPlayed += 1
      } else {
        map.set(key, {
          key,
          name:        stat.player?.displayName ?? stat.epicUsername,
          teamSide:    stat.teamSide,
          goals:       stat.goals,
          assists:     stat.assists,
          saves:       stat.saves,
          shots:       stat.shots,
          demos:       stat.demos,
          gamesPlayed: 1,
        })
      }
    }
  }
  return Array.from(map.values())
}

// ---------------------------------------------------------------------------
// TeamLogo
// ---------------------------------------------------------------------------

function TeamLogo({
  team,
  size = "md",
}: {
  team: { name: string; logoUrl: string | null; primaryColor: string | null }
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const dims =
    size === "xl" ? "h-20 w-20 text-2xl rounded-2xl" :
    size === "lg" ? "h-16 w-16 text-xl rounded-xl"   :
    size === "sm" ? "h-7 w-7 text-[10px] rounded"    :
                    "h-10 w-10 text-sm rounded-lg"
  return (
    <div
      className={cn("shrink-0 flex items-center justify-center font-bold text-white overflow-hidden", dims)}
      style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
    >
      {team.logoUrl
        ? <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
        : team.name.slice(0, 2).toUpperCase()
      }
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatBar
// ---------------------------------------------------------------------------

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total   = home + away
  const homePct = total === 0 ? 50 : Math.round((home / total) * 100)
  const awayPct = 100 - homePct
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      {/* Home side */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-sm font-bold tabular-nums text-foreground">{home}</span>
        <div className="h-2 rounded-full overflow-hidden bg-white/5 flex-1 max-w-[120px]">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${homePct}%`, marginLeft: "auto" }}
          />
        </div>
      </div>
      {/* Label */}
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground w-20 text-center">
        {label}
      </span>
      {/* Away side */}
      <div className="flex items-center gap-2">
        <div className="h-2 rounded-full overflow-hidden bg-white/5 flex-1 max-w-[120px]">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${awayPct}%` }}
          />
        </div>
        <span className="text-sm font-bold tabular-nums text-foreground">{away}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PlayerCard
// ---------------------------------------------------------------------------

function PlayerCard({ player }: { player: AggregatedPlayer }) {
  const stats = [
    { label: "GOALS",   value: player.goals   },
    { label: "ASSISTS", value: player.assists  },
    { label: "SAVES",   value: player.saves    },
    { label: "SHOTS",   value: player.shots    },
    { label: "DEMOS",   value: player.demos    },
  ]
  return (
    <div className="rounded-xl border border-border bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0"
        >
          {player.name.slice(0, 2).toUpperCase()}
        </div>
        <span className="font-semibold text-sm truncate">{player.name}</span>
        <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{player.gamesPlayed}G</span>
      </div>
      <div className="grid grid-cols-5 divide-x divide-border">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-display font-black tabular-nums">{value}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GameBadge
// ---------------------------------------------------------------------------

function GameBadge({
  gameNum,
  homeGoals,
  awayGoals,
  overtime,
  side,
}: {
  gameNum:   number
  homeGoals: number
  awayGoals: number
  overtime:  boolean
  side:      "home" | "away"
}) {
  const won = side === "home" ? homeGoals > awayGoals : awayGoals > homeGoals
  const myGoals  = side === "home" ? homeGoals : awayGoals
  const oppGoals = side === "home" ? awayGoals : homeGoals
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
      won
        ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
        : "text-muted-foreground bg-white/5 border-white/10",
    )}>
      {won ? "W" : "L"} G{gameNum}:{myGoals}–{oppGoals}{overtime ? " OT" : ""}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Params = { params: Promise<{ matchId: string }> }

export default async function MatchDetailPage({ params }: Params) {
  const { matchId } = await params
  const session = await getSession()

  const match = await getMatch(matchId)
  if (!match) notFound()

  const userId  = session?.user.id ?? null
  const isStaff = session ? hasMinRole(session.user.role, "STAFF") : false

  const myOwnedTeam = (userId && !isStaff) ? await prisma.team.findFirst({
    where: { id: { in: [match.homeTeam.id, match.awayTeam.id] }, ownerId: userId },
    select: { id: true },
  }) : null
  const myTeamId = myOwnedTeam?.id ?? null

  const canCheckIn      = match.status === "CHECKING_IN" && !!myTeamId
  const myCheckIn       = myTeamId ? match.checkIns.find(c => c.teamId === myTeamId) : null
  const alreadyCheckedIn = myCheckIn?.status === "CHECKED_IN"
  const canSubmitScore  = ["IN_PROGRESS", "MATCH_FINISHED"].includes(match.status) && (!!myTeamId || isStaff)
  const canConfirm      = match.status === "VERIFYING" && !!myTeamId && match.submittedByTeamId !== myTeamId
  const canUploadReplay = ["IN_PROGRESS", "MATCH_FINISHED"].includes(match.status) && (!!myTeamId || isStaff)

  const statusMeta  = STATUS_META[match.status]
  const homeCheckIn = match.checkIns.find(c => c.teamId === match.homeTeam.id)
  const awayCheckIn = match.checkIns.find(c => c.teamId === match.awayTeam.id)
  const replayByGame = new Map(match.replays.map(r => [r.gameNumber, r]))
  const gameByNumber = new Map(match.games.map(g => [g.gameNumber, g]))
  const showGames   = !["SCHEDULED", "CHECKING_IN", "CANCELLED"].includes(match.status)
  const disputeResolved = match.dispute &&
    (match.dispute.status === "RESOLVED" || match.dispute.status === "DISMISSED")

  // ── Stats aggregation ────────────────────────────────────────────────────
  const verifiedReplays = match.replays.filter(r => r.parseStatus === "SUCCESS")
  const allPlayers      = aggregatePlayers(verifiedReplays)
  const homePlayers     = allPlayers.filter(p => p.teamSide === "home")
  const awayPlayers     = allPlayers.filter(p => p.teamSide === "away")
  const hasStats        = allPlayers.length > 0

  const sum = (arr: AggregatedPlayer[], key: keyof AggregatedPlayer) =>
    arr.reduce((t, p) => t + (p[key] as number), 0)

  const homeTotals = {
    goals:   sum(homePlayers, "goals"),
    assists: sum(homePlayers, "assists"),
    saves:   sum(homePlayers, "saves"),
    shots:   sum(homePlayers, "shots"),
    demos:   sum(homePlayers, "demos"),
  }
  const awayTotals = {
    goals:   sum(awayPlayers, "goals"),
    assists: sum(awayPlayers, "assists"),
    saves:   sum(awayPlayers, "saves"),
    shots:   sum(awayPlayers, "shots"),
    demos:   sum(awayPlayers, "demos"),
  }

  // Per-game results for badges
  const completedGames = match.games.filter(
    g => g.homeGoals !== null && g.awayGoals !== null
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Back */}
      <Link
        href="/matches"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        All matches
      </Link>

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none z-10"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.35), transparent)" }}
          aria-hidden
        />

        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground truncate">
            {match.division.season.name}
            {" · "}{match.division.name}
            {match.leagueWeek && ` · Week ${match.leagueWeek.weekNumber}`}
          </p>
          <span className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            statusMeta.cls,
          )}>
            {statusMeta.icon}
            {statusMeta.label}
          </span>
        </div>

        {/* Teams + score */}
        <div className="grid grid-cols-3 items-center gap-4 px-5 py-8">
          {/* Home */}
          <div className="flex flex-col items-center gap-2.5 text-center">
            <TeamLogo team={match.homeTeam} size="xl" />
            <div>
              <Link
                href={`/teams/${match.homeTeam.slug}`}
                className={cn(
                  "block font-display font-bold text-sm uppercase tracking-wide hover:text-brand transition-colors",
                  match.winner?.id === match.homeTeam.id && "text-emerald-400",
                )}
              >
                {match.homeTeam.name}
              </Link>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Home</p>
            </div>
            {/* Game badges */}
            {completedGames.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-1">
                {completedGames.map(g => (
                  <GameBadge
                    key={g.gameNumber}
                    gameNum={g.gameNumber}
                    homeGoals={g.homeGoals!}
                    awayGoals={g.awayGoals!}
                    overtime={g.overtime}
                    side="home"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-2">
            {match.homeScore !== null && match.awayScore !== null ? (
              <div className="flex items-baseline gap-3 font-display font-black tabular-nums">
                <span className={cn("text-5xl", match.winner?.id === match.homeTeam.id ? "text-emerald-400" : "")}>
                  {match.homeScore}
                </span>
                <span className="text-2xl text-muted-foreground/40">–</span>
                <span className={cn("text-5xl", match.winner?.id === match.awayTeam.id ? "text-emerald-400" : "")}>
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <span className="font-display font-black text-4xl text-muted-foreground/20">VS</span>
            )}
            <p className="text-xs font-semibold text-muted-foreground">{FORMAT_LABEL[match.format] ?? match.format}</p>
            <p className="text-xs text-muted-foreground">{fmtDate(match.scheduledAt)}</p>
            {match.matchType && match.matchType !== "REGULAR" && (
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                {match.matchType.replace("_", " ")}
              </span>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2.5 text-center">
            <TeamLogo team={match.awayTeam} size="xl" />
            <div>
              <Link
                href={`/teams/${match.awayTeam.slug}`}
                className={cn(
                  "block font-display font-bold text-sm uppercase tracking-wide hover:text-brand transition-colors",
                  match.winner?.id === match.awayTeam.id && "text-emerald-400",
                )}
              >
                {match.awayTeam.name}
              </Link>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Away</p>
            </div>
            {/* Game badges */}
            {completedGames.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-1">
                {completedGames.map(g => (
                  <GameBadge
                    key={g.gameNumber}
                    gameNum={g.gameNumber}
                    homeGoals={g.homeGoals!}
                    awayGoals={g.awayGoals!}
                    overtime={g.overtime}
                    side="away"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Winner callout */}
        {match.winner && (
          <div className="border-t border-border px-5 py-3 text-center flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400">
            <Trophy className="h-4 w-4" />
            {match.winner.name} wins
          </div>
        )}
      </div>

      {/* ── Contextual banners ─────────────────────────────────────────────── */}

      {/* Check-in */}
      {match.status === "CHECKING_IN" && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-400/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <h2 className="font-semibold text-sm text-amber-400">Check-In Required</h2>
            </div>
            {match.checkInDeadlineAt && (
              <p className="text-xs text-muted-foreground">Deadline: {fmtDate(match.checkInDeadlineAt)}</p>
            )}
          </div>
          <div className="px-5 py-4 space-y-3">
            <CheckInRow team={match.homeTeam} checkIn={homeCheckIn ?? null} />
            <CheckInRow team={match.awayTeam} checkIn={awayCheckIn ?? null} />
          </div>
          {canCheckIn && (
            <div className="border-t border-amber-400/20 px-5 py-3 flex justify-end">
              {alreadyCheckedIn ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Your team is checked in
                </span>
              ) : (
                <CheckInButton matchId={matchId} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Verifying */}
      {match.status === "VERIFYING" && match.submittedByTeamId && (
        <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-5 py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-yellow-400">Awaiting confirmation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {match.submittedByTeamId === match.homeTeam.id
                  ? match.homeTeam.name
                  : match.awayTeam.name}{" "}
                submitted scores.{" "}
                {canConfirm
                  ? "Confirm below if the result is correct, or submit your own report."
                  : "Waiting for the opposing team to confirm."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dispute */}
      {match.dispute && (
        <div className={cn(
          "rounded-xl border px-5 py-4 flex items-start gap-3",
          disputeResolved ? "border-border bg-muted/20" : "border-red-400/30 bg-red-400/5",
        )}>
          <AlertTriangle className={cn("h-5 w-5 shrink-0 mt-0.5", disputeResolved ? "text-muted-foreground" : "text-red-400")} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              Dispute <span className="capitalize">{match.dispute.status.toLowerCase().replace("_", " ")}</span>
            </p>
            {match.dispute.resolvedAt && (
              <p className="text-xs text-muted-foreground mt-0.5">Resolved {fmtDate(match.dispute.resolvedAt)}</p>
            )}
          </div>
          <Link
            href={`/disputes/${match.dispute.id}`}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ── Team Stats ─────────────────────────────────────────────────────── */}
      {hasStats && (
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
        >
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-semibold text-sm">Team Stats</h2>
          </div>
          {/* Team labels */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-widest">
            <span className="text-right truncate">{match.homeTeam.name}</span>
            <span className="w-20" />
            <span className="truncate">{match.awayTeam.name}</span>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {(["goals","assists","saves","shots","demos"] as const).map(key => (
              <StatBar
                key={key}
                label={key.toUpperCase()}
                home={homeTotals[key]}
                away={awayTotals[key]}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Games grid ─────────────────────────────────────────────────────── */}
      {showGames && (
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.4), rgba(196,28,53,0.2), transparent)" }}
            aria-hidden
          />
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Games</h2>
            <span className="text-xs text-muted-foreground">
              {match.replaysVerified} / {match.gamesExpected} replays verified
            </span>
          </div>
          <div className="divide-y divide-border">
            {(Array.from({ length: match.gamesExpected ?? 0 }, (_, i) => i + 1) as number[]).map((gameNum) => {
              const replay = replayByGame.get(gameNum) ?? null
              const game   = gameByNumber.get(gameNum) ?? null
              const replayForRow: ReplayRow | null = replay
                ? { ...replay, parsedOvertime: replay.parsedOvertime ?? false }
                : null
              return (
                <GameRow
                  key={gameNum}
                  gameNum={gameNum}
                  matchId={matchId}
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  game={game}
                  replay={replayForRow}
                  canUpload={canUploadReplay}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── Player Stats ───────────────────────────────────────────────────── */}
      {hasStats && (
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
        >
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-semibold text-sm">Player Stats</h2>
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Home */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <TeamLogo team={match.homeTeam} size="sm" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate">
                  {match.homeTeam.name}
                </span>
              </div>
              {homePlayers.length > 0
                ? homePlayers.map(p => <PlayerCard key={p.key} player={p} />)
                : <p className="text-xs text-muted-foreground py-2">No player data yet.</p>
              }
            </div>
            {/* Away */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <TeamLogo team={match.awayTeam} size="sm" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate">
                  {match.awayTeam.name}
                </span>
              </div>
              {awayPlayers.length > 0
                ? awayPlayers.map(p => <PlayerCard key={p.key} player={p} />)
                : <p className="text-xs text-muted-foreground py-2">No player data yet.</p>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      {(canSubmitScore || canConfirm || isStaff) && (
        <div className="flex flex-wrap gap-3">
          {canSubmitScore && (
            <Link
              href={`/matches/${matchId}/report`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Submit Scores
            </Link>
          )}
          {canConfirm && <ConfirmButton matchId={matchId} />}
          {isStaff && (
            <Link
              href={`/admin/matches/${matchId}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
            >
              <Shield className="h-4 w-4" />
              Staff panel
            </Link>
          )}
        </div>
      )}

    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CheckInRow({
  team,
  checkIn,
}: {
  team: { name: string; logoUrl: string | null; primaryColor: string | null }
  checkIn: { status: string; checkedInAt: Date | null } | null
}) {
  const checked = checkIn?.status === "CHECKED_IN"
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-7 w-7 rounded shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
        style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
      >
        {team.logoUrl
          ? <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
          : team.name.slice(0, 2).toUpperCase()
        }
      </div>
      <span className="flex-1 text-sm font-medium truncate">{team.name}</span>
      {checked ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Checked in
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <XCircle className="h-3.5 w-3.5" /> Not yet
        </span>
      )}
    </div>
  )
}

type ReplayRow = {
  id: string
  gameNumber: number
  parseStatus: ReplayParseStatus
  parseError: string | null
  ballchasingUrl: string | null
  parsedHomeGoals: number | null
  parsedAwayGoals: number | null
  parsedOvertime: boolean | null
  uploadedByTeamId: string | null
}

type GameRowData = {
  id: string
  gameNumber: number
  homeGoals: number | null
  awayGoals: number | null
  overtime: boolean
  source: string
}

function GameRow({
  gameNum, matchId, homeTeam, awayTeam, game, replay, canUpload,
}: {
  gameNum: number
  matchId: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  game: GameRowData | null
  replay: ReplayRow | null
  canUpload: boolean
}) {
  return (
    <div className="flex items-start gap-5 px-5 py-4">
      <div className="w-8 shrink-0 pt-0.5">
        <span className="text-xl font-display font-black tabular-nums text-muted-foreground/25">{gameNum}</span>
      </div>
      <div className="w-28 shrink-0">
        {game ? (
          <div>
            <div className="flex items-baseline gap-2 font-display font-bold tabular-nums">
              <span className={cn("text-lg", game.homeGoals !== null && game.awayGoals !== null && game.homeGoals > game.awayGoals ? "text-emerald-400" : "")}>
                {game.homeGoals ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">–</span>
              <span className={cn("text-lg", game.homeGoals !== null && game.awayGoals !== null && game.awayGoals > game.homeGoals ? "text-emerald-400" : "")}>
                {game.awayGoals ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {game.overtime && (
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">OT</span>
              )}
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {game.source === "REPLAY_AUTO" ? "Replay" : game.source === "MANUAL" ? "Manual" : "Staff"}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/40">–</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <ReplayUploader
          matchId={matchId}
          gameNumber={gameNum}
          replay={replay}
          homeTeamName={homeTeam.name}
          awayTeamName={awayTeam.name}
          canUpload={canUpload}
        />
      </div>
    </div>
  )
}
