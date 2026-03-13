/**
 * /(dashboard)/matches/[matchId]/report
 *
 * Manual score submission form. Shown to team managers when the match is
 * IN_PROGRESS or MATCH_FINISHED and they haven't submitted yet.
 */

import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { hasMinRole } from "@/lib/roles"
import ScoreForm from "./_components/ScoreForm"

export const metadata: Metadata = { title: "Submit Match Scores" }

type Params = { params: Promise<{ matchId: string }> }

export default async function ReportPage({ params }: Params) {
  const { matchId } = await params
  const session = await getSession()
  if (!session) redirect("/auth/signin")

  const match = await prisma.match.findUnique({
    where: { id: matchId, deletedAt: null },
    select: {
      id:             true,
      status:         true,
      format:         true,
      gamesExpected:  true,
      homeTeam: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
      division: {
        select: {
          name: true,
          season: { select: { name: true } },
        },
      },
      replays: {
        select: { gameNumber: true, parseStatus: true, parsedHomeGoals: true, parsedAwayGoals: true, parsedOvertime: true },
      },
      games: {
        where: { source: "MANUAL" },
        select: { gameNumber: true, homeGoals: true, awayGoals: true, overtime: true },
      },
    },
  })
  if (!match) notFound()

  // Must be IN_PROGRESS or MATCH_FINISHED
  const allowedStatuses = ["IN_PROGRESS", "MATCH_FINISHED"]
  if (!allowedStatuses.includes(match.status)) {
    redirect(`/matches/${matchId}`)
  }

  // gamesExpected must be set for the form to work
  if (!match.gamesExpected) redirect(`/matches/${matchId}`)
  const gamesExpected = match.gamesExpected

  // Must be a team owner or staff
  const isStaff = hasMinRole(session.user.role, "STAFF")
  if (!isStaff) {
    const owned = await prisma.team.findFirst({
      where: { id: { in: [match.homeTeam.id, match.awayTeam.id] }, ownerId: session.user.id },
      select: { id: true },
    })
    if (!owned) redirect(`/matches/${matchId}`)
  }

  // Games that have verified replays are locked — pass their data so the form can show them
  const successReplays = match.replays.filter(r => r.parseStatus === "SUCCESS")
  const lockedGameNums = new Set(successReplays.map(r => r.gameNumber))

  // Pre-fill with any previously submitted manual games (for re-submission)
  const preFill = match.games.reduce<Record<number, { homeGoals: number; awayGoals: number; overtime: boolean }>>(
    (acc, g) => {
      acc[g.gameNumber] = { homeGoals: g.homeGoals ?? 0, awayGoals: g.awayGoals ?? 0, overtime: g.overtime }
      return acc
    },
    {},
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/matches" className="hover:text-brand transition-colors">Matches</Link>
        <span className="opacity-40">/</span>
        <Link href={`/matches/${matchId}`} className="hover:text-brand transition-colors">Match Detail</Link>
        <span className="opacity-40">/</span>
        <span className="text-foreground">Submit Scores</span>
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
        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.2)" }}
          >
            <ChevronLeft className="h-5 w-5 rotate-180" style={{ color: "rgba(196,28,53,0.9)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "rgba(196,28,53,0.8)" }}>
              {match.division.season.name} · {match.division.name}
            </p>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide">Submit Scores</h1>
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {match.homeTeam.name} vs {match.awayTeam.name} — {FORMAT_LABEL[match.format] ?? match.format}
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
      >
      <ScoreForm
        matchId={matchId}
        gamesExpected={gamesExpected}
        homeTeam={{ id: match.homeTeam.id, name: match.homeTeam.name, logoUrl: match.homeTeam.logoUrl, primaryColor: match.homeTeam.primaryColor }}
        awayTeam={{ id: match.awayTeam.id, name: match.awayTeam.name, logoUrl: match.awayTeam.logoUrl, primaryColor: match.awayTeam.primaryColor }}
        lockedGames={successReplays.map(r => ({
          gameNumber:   r.gameNumber,
          homeGoals:    r.parsedHomeGoals ?? 0,
          awayGoals:    r.parsedAwayGoals ?? 0,
          overtime:     r.parsedOvertime ?? false,
        }))}
        lockedGameNums={Array.from(lockedGameNums)}
        preFill={preFill}
        isStaff={isStaff}
      />
      </div>

    </div>
  )
}

const FORMAT_LABEL: Record<string, string> = {
  BO1: "Best of 1",
  BO3: "Best of 3",
  BO5: "Best of 5",
  BO7: "Best of 7",
}
