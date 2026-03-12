/**
 * /admin/disputes/[disputeId]
 *
 * Dispute detail page — shows match context, both teams' scores, replay
 * parse data, and staff resolve/dismiss action.
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  FileText,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/utils/dates"
import type { DisputeStatus } from "@prisma/client"
import DisputeActions from "./_components/DisputeActions"

export const metadata: Metadata = { title: "Dispute Detail — Staff" }

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getDispute(disputeId: string) {
  return prisma.dispute.findUnique({
    where: { id: disputeId },
    select: {
      id:                true,
      status:            true,
      reason:            true,
      evidenceUrl:       true,
      resolution:        true,
      resolvedAt:        true,
      createdAt:         true,
      filedByTeamId:     true,
      originalHomeScore: true,
      originalAwayScore: true,
      resolvedHomeScore: true,
      resolvedAwayScore: true,
      resolvedBy: { select: { name: true } },
      match: {
        select: {
          id:          true,
          status:      true,
          format:      true,
          homeScore:   true,
          awayScore:   true,
          homeTeam: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
          division: { select: { name: true, season: { select: { name: true, slug: true } } } },
          leagueWeek: { select: { weekNumber: true } },
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
          replays: {
            orderBy: { gameNumber: "asc" },
            select: {
              gameNumber:      true,
              parseStatus:     true,
              parsedHomeGoals: true,
              parsedAwayGoals: true,
              parsedOvertime:  true,
              ballchasingUrl:  true,
              uploadedByTeamId: true,
            },
          },
        },
      },
    },
  })
}

type Dispute = NonNullable<Awaited<ReturnType<typeof getDispute>>>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<DisputeStatus, { label: string; cls: string; borderCls: string; icon: React.ReactNode }> = {
  OPEN:         { label: "Open",         cls: "bg-destructive/15 text-destructive",  borderCls: "border-destructive/30",  icon: <AlertTriangle className="h-4 w-4" /> },
  UNDER_REVIEW: { label: "Under Review", cls: "bg-amber-500/15 text-amber-400",      borderCls: "border-amber-400/30",    icon: <Eye className="h-4 w-4" /> },
  RESOLVED:     { label: "Resolved",     cls: "bg-emerald-500/15 text-emerald-400",  borderCls: "border-emerald-400/30",  icon: <CheckCircle2 className="h-4 w-4" /> },
  DISMISSED:    { label: "Dismissed",    cls: "bg-muted text-muted-foreground",       borderCls: "border-transparent",     icon: <XCircle className="h-4 w-4" /> },
}

function TeamChip({
  team,
}: {
  team: { name: string; logoUrl: string | null; primaryColor: string | null }
}) {
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
      <span className="text-sm font-medium">{team.name}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>
}) {
  const { disputeId } = await params
  const dispute = await getDispute(disputeId)
  if (!dispute) notFound()

  const { match } = dispute
  const meta = STATUS_META[dispute.status]

  const replayByGame = new Map(match.replays.map((r) => [r.gameNumber, r]))

  const filingTeamName =
    match.homeTeam.id === dispute.filedByTeamId
      ? match.homeTeam.name
      : match.awayTeam.name

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Back */}
      <Link
        href="/admin/disputes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        All disputes
      </Link>

      {/* Status banner */}
      <div className={cn(
        "rounded-xl px-5 py-4 flex items-center gap-3",
        meta.cls,
      )} style={{ border: `1px solid ${dispute.status === "OPEN" ? "rgba(196,28,53,0.3)" : dispute.status === "UNDER_REVIEW" ? "rgba(245,158,11,0.3)" : dispute.status === "RESOLVED" ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}` }}>
        {meta.icon}
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">{meta.label}</span>
          {dispute.resolvedAt && (
            <span className="ml-2 text-xs opacity-75">
              {dispute.status === "RESOLVED" ? "Resolved" : "Dismissed"} by{" "}
              {dispute.resolvedBy?.name ?? "staff"} · {formatDateTime(dispute.resolvedAt)}
            </span>
          )}
        </div>
        <Link
          href={`/matches/${match.id}`}
          target="_blank"
          className="shrink-0 inline-flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
        >
          Public view <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">

          {/* Match context */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs text-muted-foreground mb-2">
                {match.division.season.name} · {match.division.name}
                {match.leagueWeek && ` · Week ${match.leagueWeek.weekNumber}`}
              </p>
              <div className="flex items-center gap-4">
                <TeamChip team={match.homeTeam} />
                <div className="font-display font-black tabular-nums text-xl flex items-baseline gap-2">
                  <span>{match.homeScore ?? "—"}</span>
                  <span className="text-muted-foreground/40 text-base">–</span>
                  <span>{match.awayScore ?? "—"}</span>
                </div>
                <TeamChip team={match.awayTeam} />
              </div>
            </div>

            {/* Per-game breakdown */}
            {match.games.length > 0 && (
              <div className="divide-y divide-border">
                {match.games.map((game) => {
                  const replay = replayByGame.get(game.gameNumber)
                  const homeWon  = game.homeGoals !== null && game.awayGoals !== null && game.homeGoals > game.awayGoals
                  const awayWon  = game.homeGoals !== null && game.awayGoals !== null && game.awayGoals > game.homeGoals
                  const hasMismatch = replay?.parseStatus === "MISMATCH" && replay.parsedHomeGoals !== null

                  return (
                    <div key={game.id} className="px-5 py-3 flex items-center gap-4">
                      <span className="w-6 shrink-0 text-sm font-display font-black tabular-nums text-muted-foreground/30">
                        {game.gameNumber}
                      </span>

                      {/* Submitted score */}
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Submitted</p>
                        <div className="flex items-baseline gap-1.5 font-display font-bold tabular-nums">
                          <span className={cn("text-lg", homeWon ? "text-emerald-400" : "")}>{game.homeGoals ?? "—"}</span>
                          <span className="text-xs text-muted-foreground/40">–</span>
                          <span className={cn("text-lg", awayWon ? "text-emerald-400" : "")}>{game.awayGoals ?? "—"}</span>
                          {game.overtime && <span className="text-[10px] text-amber-400 font-semibold">OT</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {game.source === "REPLAY_AUTO" ? "Replay" : game.source === "MANUAL" ? "Manual" : "Staff"}
                        </p>
                      </div>

                      {/* Parsed replay score if mismatch */}
                      {hasMismatch && replay && (
                        <div className="flex-1 border-l border-destructive/30 pl-4">
                          <p className="text-xs text-destructive mb-0.5">Replay parsed</p>
                          <div className="flex items-baseline gap-1.5 font-display font-bold tabular-nums text-destructive">
                            <span className="text-lg">{replay.parsedHomeGoals}</span>
                            <span className="text-xs opacity-50">–</span>
                            <span className="text-lg">{replay.parsedAwayGoals}</span>
                            {replay.parsedOvertime && <span className="text-[10px] font-semibold">OT</span>}
                          </div>
                          {replay.ballchasingUrl && (
                            <a
                              href={replay.ballchasingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-brand transition-colors mt-0.5"
                            >
                              ballchasing <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Dispute reason */}
          <div
            className="rounded-xl p-5 space-y-3"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="font-semibold text-sm">Dispute Reason</h2>
              <p className="text-xs text-muted-foreground">
                Filed by {filingTeamName} · {formatDateTime(dispute.createdAt)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {dispute.reason}
            </p>
            {dispute.evidenceUrl && (
              <a
                href={dispute.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand/80 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                View evidence
              </a>
            )}
          </div>

          {/* Resolution notes (if already resolved/dismissed) */}
          {dispute.resolution && (
            <div
              className="rounded-xl p-5 space-y-2"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <h2 className="font-semibold text-sm">Resolution Notes</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {dispute.resolution}
              </p>
              <div className="mt-3 flex gap-6 text-xs text-muted-foreground">
                {dispute.originalHomeScore !== null && (
                  <span>
                    Original:{" "}
                    <span className="font-mono">{dispute.originalHomeScore} – {dispute.originalAwayScore}</span>
                  </span>
                )}
                {dispute.resolvedHomeScore !== null && (
                  <span>
                    Corrected:{" "}
                    <span className="font-mono font-semibold text-emerald-400">
                      {dispute.resolvedHomeScore} – {dispute.resolvedAwayScore}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar — staff action + quick links */}
        <div className="space-y-4">
          <DisputeActions disputeId={disputeId} currentStatus={dispute.status} />

          <div
            className="rounded-xl p-4 space-y-2"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Links</p>
            <Link
              href={`/admin/matches/${match.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              Staff match panel
            </Link>
            <Link
              href={`/matches/${match.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              Public match page
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
