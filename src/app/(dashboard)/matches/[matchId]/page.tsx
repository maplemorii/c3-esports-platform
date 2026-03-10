/**
 * /(dashboard)/matches/[matchId]
 *
 * Match detail page — status banner, check-in panel, per-game grid with
 * replay upload slots, and contextual action buttons.
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
        },
      },
      dispute: {
        select: {
          id: true,
          status: true,
          reason: true,
          resolvedAt: true,
        },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<MatchStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  SCHEDULED:      { label: "Scheduled",      cls: "text-muted-foreground bg-muted border-transparent",                            icon: <Clock className="h-3.5 w-3.5" /> },
  CHECKING_IN:    { label: "Check-In",       cls: "text-amber-400 bg-amber-400/10 border-amber-400/30",                          icon: <Clock className="h-3.5 w-3.5" /> },
  IN_PROGRESS:    { label: "In Progress",    cls: "text-blue-400 bg-blue-400/10 border-blue-400/30",                             icon: <Swords className="h-3.5 w-3.5" /> },
  MATCH_FINISHED: { label: "Match Finished", cls: "text-purple-400 bg-purple-400/10 border-purple-400/30",                       icon: <Upload className="h-3.5 w-3.5" /> },
  VERIFYING:      { label: "Verifying",      cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",                       icon: <Shield className="h-3.5 w-3.5" /> },
  COMPLETED:      { label: "Completed",      cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",                    icon: <Trophy className="h-3.5 w-3.5" /> },
  DISPUTED:       { label: "Disputed",       cls: "text-red-400 bg-red-400/10 border-red-400/30",                                icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  FORFEITED:      { label: "Forfeited",      cls: "text-muted-foreground bg-muted border-transparent",                            icon: <XCircle className="h-3.5 w-3.5" /> },
  NO_SHOW:        { label: "No Show",        cls: "text-muted-foreground bg-muted border-transparent",                            icon: <XCircle className="h-3.5 w-3.5" /> },
  CANCELLED:      { label: "Cancelled",      cls: "text-muted-foreground bg-muted border-transparent",                            icon: <XCircle className="h-3.5 w-3.5" /> },
}

const FORMAT_LABEL: Record<string, string> = {
  BO1: "Best of 1",
  BO3: "Best of 3",
  BO5: "Best of 5",
  BO7: "Best of 7",
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function TeamLogo({
  team,
  size = "md",
}: {
  team: { name: string; logoUrl: string | null; primaryColor: string | null }
  size?: "sm" | "md" | "lg"
}) {
  const dims = size === "lg" ? "h-16 w-16 text-xl rounded-xl" : size === "sm" ? "h-7 w-7 text-[10px] rounded" : "h-10 w-10 text-sm rounded-lg"
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
// Page
// ---------------------------------------------------------------------------

type Params = { params: Promise<{ matchId: string }> }

export default async function MatchDetailPage({ params }: Params) {
  const { matchId } = await params
  const session = await getSession()
  // No redirect — unauthenticated users see a read-only public view

  const match = await getMatch(matchId)
  if (!match) notFound()

  const userId  = session?.user.id ?? null
  const isStaff = session ? hasMinRole(session.user.role, "STAFF") : false

  // Which team does the user own within this match?
  const myOwnedTeam = (userId && !isStaff) ? await prisma.team.findFirst({
    where: { id: { in: [match.homeTeam.id, match.awayTeam.id] }, ownerId: userId },
    select: { id: true },
  }) : null
  const myTeamId = myOwnedTeam?.id ?? null

  // Contextual permissions (all false for unauthenticated visitors)
  const canCheckIn     = match.status === "CHECKING_IN" && !!myTeamId
  const myCheckIn      = myTeamId ? match.checkIns.find(c => c.teamId === myTeamId) : null
  const alreadyCheckedIn = myCheckIn?.status === "CHECKED_IN"

  const canSubmitScore = ["IN_PROGRESS", "MATCH_FINISHED"].includes(match.status) && (!!myTeamId || isStaff)
  const canConfirm     = match.status === "VERIFYING" && !!myTeamId && match.submittedByTeamId !== myTeamId

  const canUploadReplay = ["IN_PROGRESS", "MATCH_FINISHED"].includes(match.status) && (!!myTeamId || isStaff)

  // Helpers
  const statusMeta   = STATUS_META[match.status]
  const homeCheckIn  = match.checkIns.find(c => c.teamId === match.homeTeam.id)
  const awayCheckIn  = match.checkIns.find(c => c.teamId === match.awayTeam.id)
  const replayByGame = new Map(match.replays.map(r => [r.gameNumber, r]))
  const gameByNumber = new Map(match.games.map(g => [g.gameNumber, g]))
  const showGames    = !["SCHEDULED", "CHECKING_IN", "CANCELLED"].includes(match.status)

  const disputeResolved = match.dispute &&
    (match.dispute.status === "RESOLVED" || match.dispute.status === "DISMISSED")

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Back link */}
      <Link
        href="/matches"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        All matches
      </Link>

      {/* Hero card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Top bar — breadcrumb + status */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground truncate">
            {match.division.season.name}
            {" · "}
            {match.division.name}
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

        {/* Teams */}
        <div className="grid grid-cols-3 items-center gap-4 px-5 py-10">
          {/* Home */}
          <div className="flex flex-col items-center gap-2.5 text-center">
            <TeamLogo team={match.homeTeam} size="lg" />
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
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-1.5">
            {match.homeScore !== null && match.awayScore !== null ? (
              <div className="flex items-baseline gap-3 font-display font-black tabular-nums">
                <span className={cn("text-4xl", match.winner?.id === match.homeTeam.id ? "text-emerald-400" : "")}>
                  {match.homeScore}
                </span>
                <span className="text-xl text-muted-foreground/50">–</span>
                <span className={cn("text-4xl", match.winner?.id === match.awayTeam.id ? "text-emerald-400" : "")}>
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <span className="font-display font-black text-3xl text-muted-foreground/25">VS</span>
            )}
            <p className="text-xs font-medium text-muted-foreground">{FORMAT_LABEL[match.format] ?? match.format}</p>
            <p className="text-xs text-muted-foreground">{fmtDate(match.scheduledAt)}</p>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2.5 text-center">
            <TeamLogo team={match.awayTeam} size="lg" />
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
          </div>
        </div>

        {/* Winner callout */}
        {match.winner && (
          <div className="border-t border-border px-5 py-2.5 text-center flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400">
            <Trophy className="h-4 w-4" />
            {match.winner.name} wins
          </div>
        )}
      </div>

      {/* Check-in panel */}
      {match.status === "CHECKING_IN" && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-400/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <h2 className="font-semibold text-sm text-amber-400">Check-In Required</h2>
            </div>
            {match.checkInDeadlineAt && (
              <p className="text-xs text-muted-foreground">
                Deadline: {fmtDate(match.checkInDeadlineAt)}
              </p>
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

      {/* VERIFYING — waiting for confirmation */}
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

      {/* Dispute banner */}
      {match.dispute && (
        <div className={cn(
          "rounded-xl border px-5 py-4 flex items-start gap-3",
          disputeResolved
            ? "border-border bg-muted/20"
            : "border-red-400/30 bg-red-400/5",
        )}>
          <AlertTriangle className={cn(
            "h-5 w-5 shrink-0 mt-0.5",
            disputeResolved ? "text-muted-foreground" : "text-red-400",
          )} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              Dispute{" "}
              <span className="capitalize">{match.dispute.status.toLowerCase().replace("_", " ")}</span>
            </p>
            {match.dispute.resolvedAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Resolved {fmtDate(match.dispute.resolvedAt)}
              </p>
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

      {/* Games grid */}
      {showGames && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
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

      {/* Action buttons */}
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
          {canConfirm && (
            <ConfirmButton matchId={matchId} />
          )}
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
// Server sub-components
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
          <CheckCircle2 className="h-3.5 w-3.5" />
          Checked in
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <XCircle className="h-3.5 w-3.5" />
          Not yet
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
  gameNum,
  matchId,
  homeTeam,
  awayTeam,
  game,
  replay,
  canUpload,
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
      {/* Game number */}
      <div className="w-8 shrink-0 pt-0.5">
        <span className="text-xl font-display font-black tabular-nums text-muted-foreground/25">
          {gameNum}
        </span>
      </div>

      {/* Score */}
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

      {/* Replay */}
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
