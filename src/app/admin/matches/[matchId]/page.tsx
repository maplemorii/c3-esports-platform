/**
 * /admin/matches/[matchId]
 *
 * Match detail page for staff — full info, check-in state, game results,
 * active dispute, and all staff actions.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatDate, formatRelative } from "@/lib/utils/dates"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  Swords,
} from "lucide-react"
import { StaffMatchActions } from "@/components/staff/StaffMatchActions"
import { DisputeCard } from "@/components/staff/DisputeCard"
import { DeleteMatchButton } from "./DeleteMatchButton"
import type { MatchStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id:                true,
      status:            true,
      format:            true,
      matchType:         true,
      scheduledAt:       true,
      checkInOpenAt:     true,
      checkInDeadlineAt: true,
      completedAt:       true,
      homeScore:         true,
      awayScore:         true,
      notes:             true,

      homeTeam: { select: { id: true, name: true, slug: true } },
      awayTeam: { select: { id: true, name: true, slug: true } },
      winner:   { select: { id: true, name: true } },
      division: {
        select: {
          id:   true,
          name: true,
          tier: true,
          season: { select: { id: true, name: true } },
        },
      },
      leagueWeek: { select: { id: true, weekNumber: true } },

      checkIns: {
        select: {
          id:          true,
          teamId:      true,
          status:      true,
          checkedInAt: true,
          team: { select: { id: true, name: true } },
        },
      },

      games: {
        orderBy: { gameNumber: "asc" },
        select: {
          id:         true,
          gameNumber: true,
          homeGoals:  true,
          awayGoals:  true,
          overtime:   true,
          source:     true,
        },
      },

      dispute: {
        select: {
          id:          true,
          status:      true,
          reason:      true,
          evidenceUrl: true,
          resolution:  true,
          createdAt:   true,
          resolvedAt:  true,
          filedByTeamId: true,
        },
      },
    },
  })
}

type Match = NonNullable<Awaited<ReturnType<typeof getData>>>

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ matchId: string }>
}): Promise<Metadata> {
  const { matchId } = await params
  const match = await getData(matchId)
  if (!match) return { title: "Match Not Found" }
  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name} — Staff`,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<MatchStatus, { label: string; cls: string }> = {
  SCHEDULED:      { label: "Scheduled",      cls: "bg-sky-500/15 text-sky-400" },
  CHECKING_IN:    { label: "Check-In",       cls: "bg-amber-500/15 text-amber-400" },
  IN_PROGRESS:    { label: "In Progress",    cls: "bg-brand/15 text-brand" },
  MATCH_FINISHED: { label: "Match Finished", cls: "bg-purple-500/15 text-purple-400" },
  VERIFYING:      { label: "Verifying",      cls: "bg-sky-500/15 text-sky-400" },
  COMPLETED:      { label: "Completed",      cls: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED:      { label: "Cancelled",      cls: "bg-muted text-muted-foreground" },
  FORFEITED:      { label: "Forfeited",      cls: "bg-destructive/15 text-destructive" },
  DISPUTED:       { label: "Disputed",       cls: "bg-orange-500/15 text-orange-400" },
  NO_SHOW:        { label: "No Show",        cls: "bg-muted text-muted-foreground" },
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-sm text-right">{value ?? <span className="text-muted-foreground/50">—</span>}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminMatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  const match = await getData(matchId)
  if (!match) notFound()
  if (match.deletedAt) redirect("/admin/matches")

  const meta = STATUS_META[match.status]

  const homeCheckIn = match.checkIns.find((c) => c.teamId === match.homeTeam.id)
  const awayCheckIn = match.checkIns.find((c) => c.teamId === match.awayTeam.id)
  const homeCheckedIn = homeCheckIn?.status === "CHECKED_IN"
  const awayCheckedIn = awayCheckIn?.status === "CHECKED_IN"

  const disputeFiledByTeamName = match.dispute
    ? (match.dispute.filedByTeamId === match.homeTeam.id
        ? match.homeTeam.name
        : match.awayTeam.name)
    : undefined

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/admin/matches" className="flex items-center gap-1 hover:text-brand transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Matches
          </Link>
          <span>/</span>
          <span className="text-foreground truncate">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </span>
        </div>
        <DeleteMatchButton matchId={match.id} />
      </div>

      {/* Header card */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.7), rgba(59,130,246,0.4), transparent)" }}
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(196,28,53,0.8)" }}>
          Staff Panel · Match Detail
        </p>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-black uppercase tracking-wide">
                {match.homeTeam.name}
                <span className="mx-3 text-muted-foreground font-normal text-xl">vs</span>
                {match.awayTeam.name}
              </h1>
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase",
                meta.cls,
              )}>
                {meta.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {match.division.season.name} · {match.division.name}
              {match.leagueWeek && ` · Week ${match.leagueWeek.weekNumber}`}
            </p>
          </div>

          {match.homeScore !== null && match.awayScore !== null && (
            <div
              className="rounded-xl px-6 py-3 text-center shrink-0"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="font-display text-3xl font-bold tabular-nums">
                {match.homeScore} – {match.awayScore}
              </p>
              {match.winner && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <Trophy className="inline h-3 w-3 mr-1 text-amber-400" />
                  {match.winner.name} wins
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* Left column */}
        <div className="space-y-6">

          {/* Match info */}
          <div
            className="rounded-xl p-5"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Match Info
            </h2>
            <div>
              <InfoRow label="Format"    value={match.format} />
              <InfoRow label="Type"      value={match.matchType} />
              <InfoRow label="Scheduled" value={match.scheduledAt ? formatDate(new Date(match.scheduledAt)) : null} />
              <InfoRow label="Check-In Opens" value={match.checkInOpenAt ? formatDate(new Date(match.checkInOpenAt)) : null} />
              <InfoRow label="Check-In Deadline" value={match.checkInDeadlineAt ? formatDate(new Date(match.checkInDeadlineAt)) : null} />
              <InfoRow label="Completed" value={match.completedAt ? formatRelative(match.completedAt) : null} />
              {match.notes && <InfoRow label="Notes" value={match.notes} />}
            </div>
          </div>

          {/* Check-in status */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="flex items-center gap-2 px-5 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Check-In Status
              </h2>
            </div>
            <div>
              {[
                { team: match.homeTeam, checkIn: homeCheckIn, checkedIn: homeCheckedIn },
                { team: match.awayTeam, checkIn: awayCheckIn, checkedIn: awayCheckedIn },
              ].map(({ team, checkIn, checkedIn }) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span className="text-sm font-medium">{team.name}</span>
                  <div className="flex items-center gap-2">
                    {checkedIn ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-emerald-400">Checked in</span>
                        {checkIn?.checkedInAt && (
                          <span className="text-xs text-muted-foreground/60">
                            {formatRelative(checkIn.checkedInAt)}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground">Not checked in</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Games */}
          {match.games.length > 0 && (
            <div
              className="relative overflow-hidden rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex items-center gap-2 px-5 py-3.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Swords className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Games
                </h2>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-[3rem_1fr_1fr_4rem] gap-2 px-5 py-2 border-b border-border">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">#</span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{match.homeTeam.name}</span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{match.awayTeam.name}</span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground text-right">Source</span>
              </div>

              <div className="divide-y divide-border">
                {match.games.map((game) => {
                  const homeWin = game.homeGoals > game.awayGoals
                  const awayWin = game.awayGoals > game.homeGoals
                  return (
                    <div key={game.id} className="grid grid-cols-[3rem_1fr_1fr_4rem] gap-2 px-5 py-3 items-center">
                      <span className="text-xs text-muted-foreground">{game.gameNumber}</span>
                      <span className={cn(
                        "text-sm font-bold tabular-nums font-display",
                        homeWin ? "text-emerald-400" : "text-muted-foreground",
                      )}>
                        {game.homeGoals}
                      </span>
                      <span className={cn(
                        "text-sm font-bold tabular-nums font-display",
                        awayWin ? "text-emerald-400" : "text-muted-foreground",
                      )}>
                        {game.awayGoals}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 text-right uppercase tracking-wider">
                        {game.source ?? "—"}
                        {game.overtime && " (OT)"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dispute */}
          {match.dispute && (
            <DisputeCard
              dispute={{
                id:              match.dispute.id,
                status:          match.dispute.status,
                reason:          match.dispute.reason,
                evidenceUrl:     match.dispute.evidenceUrl,
                resolution:      match.dispute.resolution,
                createdAt:       match.dispute.createdAt,
                resolvedAt:      match.dispute.resolvedAt,
                filedByTeamName: disputeFiledByTeamName,
              }}
            />
          )}

        </div>

        {/* Right column — staff actions */}
        <div>
          <StaffMatchActions
            matchId={match.id}
            status={match.status}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homeCheckedIn={homeCheckedIn}
            awayCheckedIn={awayCheckedIn}
            scheduledAt={match.scheduledAt?.toISOString()}
            notes={match.notes}
          />
        </div>

      </div>
    </div>
  )
}
