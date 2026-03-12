/**
 * /standings  (dashboard)
 *
 * Shows standings for the division(s) the current user's teams are registered in.
 * If a user has multiple active registrations, shows each division.
 * Links to the full public standings page.
 */

import React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { BarChart2, ChevronRight, ArrowUp, ArrowDown, Minus, ExternalLink } from "lucide-react"
import type { DivisionTier } from "@prisma/client"

export const metadata: Metadata = { title: "My Standings" }

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getMyStandings(userId: string) {
  // Find the player's active memberships → their teams → APPROVED registrations
  const memberships = await prisma.teamMembership.findMany({
    where: {
      leftAt: null,
      player: { userId, deletedAt: null },
      team:   { deletedAt: null },
    },
    select: { teamId: true },
  })

  const ownedTeams = await prisma.team.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true },
  })

  const teamIds = [
    ...new Set([
      ...memberships.map((m) => m.teamId),
      ...ownedTeams.map((t) => t.id),
    ]),
  ]

  if (teamIds.length === 0) return { divisions: [], activeSeason: null }

  // Get APPROVED registrations for the current active season
  const activeSeason = await prisma.season.findFirst({
    where:   { status: { in: ["ACTIVE", "PLAYOFFS"] } },
    orderBy: { createdAt: "desc" },
    select:  { id: true, name: true, slug: true },
  })

  if (!activeSeason) return { divisions: [], activeSeason: null }

  const registrations = await prisma.seasonRegistration.findMany({
    where: {
      seasonId:   activeSeason.id,
      teamId:     { in: teamIds },
      status:     "APPROVED",
      divisionId: { not: null },
    },
    select: {
      teamId:   true,
      division: {
        select: {
          id:   true,
          name: true,
          tier: true,
          standingEntries: {
            orderBy: [
              { points:           "desc" },
              { gameDifferential: "desc" },
              { goalDifferential: "desc" },
            ],
            select: {
              id:               true,
              points:           true,
              wins:             true,
              losses:           true,
              matchesPlayed:    true,
              gamesWon:         true,
              gamesLost:        true,
              gameDifferential: true,
              streak:           true,
              teamId:           true,
              team: {
                select: {
                  id:           true,
                  name:         true,
                  slug:         true,
                  logoUrl:      true,
                  primaryColor: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // Deduplicate divisions (user might be on multiple teams in same division)
  const seen = new Set<string>()
  const divisions = registrations
    .flatMap((r) => r.division ? [r.division] : [])
    .filter((d) => {
      if (seen.has(d.id)) return false
      seen.add(d.id)
      return true
    })

  // Fetch H2H records for all relevant divisions
  const divisionIds = divisions.map((d) => d.id)
  const h2hRecords = divisionIds.length > 0
    ? await prisma.headToHeadRecord.findMany({
        where: { divisionId: { in: divisionIds } },
        select: { divisionId: true, teamId: true, opponentId: true, wins: true, losses: true },
      })
    : []

  // Index by divisionId + teamId
  const h2hIndex = new Map<string, { opponentId: string; wins: number; losses: number }[]>()
  for (const r of h2hRecords) {
    const key = `${r.divisionId}:${r.teamId}`
    const list = h2hIndex.get(key) ?? []
    list.push({ opponentId: r.opponentId, wins: r.wins, losses: r.losses })
    h2hIndex.set(key, list)
  }

  return { divisions, activeSeason, myTeamIds: teamIds, h2hIndex }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:     "Premier",
  CHALLENGERS: "Open Challengers",
  CONTENDERS:  "Open Contenders",
}

const TIER_ACCENT: Record<DivisionTier, { topBorder: string; badge: string }> = {
  PREMIER:     { topBorder: "linear-gradient(90deg, rgba(251,191,36,0.7), rgba(196,28,53,0.3), transparent)", badge: "text-amber-400 border-amber-400/30 bg-amber-400/8" },
  CHALLENGERS: { topBorder: "linear-gradient(90deg, rgba(59,130,246,0.7), rgba(196,28,53,0.3), transparent)", badge: "text-blue-400 border-blue-400/30 bg-blue-400/8"   },
  CONTENDERS:  { topBorder: "linear-gradient(90deg, rgba(52,211,153,0.5), rgba(59,130,246,0.3), transparent)", badge: "text-emerald-400 border-emerald-400/30 bg-emerald-400/8" },
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return <Minus className="h-3 w-3 text-muted-foreground" />
  const isWin = streak > 0
  return (
    <span className={cn(
      "flex items-center gap-0.5 text-xs font-semibold",
      isWin ? "text-emerald-400" : "text-destructive"
    )}>
      {isWin ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(streak)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardStandingsPage() {
  const session = await getSession()
  if (!session) redirect("/auth/signin")

  const { divisions, activeSeason, myTeamIds = [], h2hIndex = new Map<string, { opponentId: string; wins: number; losses: number }[]>() } = await getMyStandings(session.user.id)
  const myTeamSet = new Set(myTeamIds)

  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.4), transparent)" }}
          aria-hidden
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-brand/70">
              Dashboard
            </p>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
              My Standings
            </h1>
            {activeSeason && (
              <p className="mt-1 text-sm text-muted-foreground">{activeSeason.name}</p>
            )}
          </div>
          {activeSeason && (
            <Link
              href={`/seasons/${activeSeason.slug}/standings`}
              className="flex items-center gap-1.5 text-xs text-brand/70 hover:text-brand transition-colors duration-150"
            >
              Full standings
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* No active season / no registrations */}
      {divisions.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <BarChart2 className="h-10 w-10 text-muted-foreground/30" />
          {!activeSeason ? (
            <p className="text-muted-foreground">No active season right now.</p>
          ) : (
            <>
              <p className="text-muted-foreground">Your team isn&apos;t registered in an active division yet.</p>
              <Link href="/seasons" className="text-xs text-brand hover:underline">
                Browse seasons
              </Link>
            </>
          )}
        </div>
      )}

      {/* Division standings (max STANDINGS_PREVIEW_COUNT rows, highlight my teams) */}
      {divisions.map((division) => {
        const entries = division.standingEntries
        const myRank  = entries.findIndex((e) => myTeamSet.has(e.teamId)) + 1

        const accent = TIER_ACCENT[division.tier]

        return (
          <section key={division.id} className="relative rounded-2xl overflow-hidden border border-border bg-card">
            {/* Tier-colored top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: accent.topBorder }}
              aria-hidden
            />

            {/* My rank callout if in top half */}
            {myRank > 0 && (
              <div
                className="flex items-center justify-between px-5 pt-5 pb-0"
              >
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: "rgba(196,28,53,0.08)", border: "1px solid rgba(196,28,53,0.15)" }}
                >
                  <BarChart2 className="h-3.5 w-3.5 text-brand" />
                  <span className="text-foreground/75">
                    Your team is ranked{" "}
                    <span
                      className="font-bold"
                      style={{ color: myRank <= 3 ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.85)" }}
                    >
                      #{myRank}
                    </span>
                    {" "}of {entries.length}
                  </span>
                </div>
              </div>
            )}

            {/* Section header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 mt-3">
              <div>
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest mb-1", accent.badge)}>
                  {TIER_LABEL[division.tier]}
                </span>
                <h2 className="font-display text-base font-bold uppercase tracking-wide">
                  {division.name}
                </h2>
              </div>
              {activeSeason && (
                <Link
                  href={`/seasons/${activeSeason.slug}/standings?division=${division.id}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-brand transition-colors duration-150"
                >
                  Full table <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pl-4 pr-2 text-left w-8">#</th>
                    <th className="py-2 px-2 text-left">Team</th>
                    <th className="py-2 px-2 text-center">W</th>
                    <th className="py-2 px-2 text-center">L</th>
                    <th className="py-2 px-2 text-center hidden sm:table-cell">GD</th>
                    <th className="py-2 px-2 text-center hidden lg:table-cell">H2H</th>
                    <th className="py-2 px-2 text-center font-bold">PTS</th>
                    <th className="py-2 pl-2 pr-4 text-center hidden md:table-cell">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry, i) => {
                    const isMyTeam = myTeamSet.has(entry.teamId)
                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          "transition-colors",
                          isMyTeam
                            ? "bg-brand/8 hover:bg-brand/12"
                            : "hover:bg-muted/30"
                        )}
                      >
                        <td className="py-2.5 pl-4 pr-2 text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="py-2.5 px-2">
                          <Link
                            href={`/teams/${entry.team.slug}`}
                            className="flex items-center gap-2 hover:text-brand transition-colors"
                          >
                            <div
                              className="h-6 w-6 shrink-0 rounded overflow-hidden flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ backgroundColor: entry.team.primaryColor ?? "oklch(0.50 0.20 15)" }}
                            >
                              {entry.team.logoUrl
                                ? <img src={entry.team.logoUrl} alt="" className="h-full w-full object-cover" />
                                : entry.team.name.slice(0, 2).toUpperCase()
                              }
                            </div>
                            <span className={cn("font-medium truncate", isMyTeam && "font-bold")}>
                              {entry.team.name}
                            </span>
                            {isMyTeam && (
                              <span className="shrink-0 rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                                You
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-emerald-400 font-semibold">{entry.wins}</td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-destructive">{entry.losses}</td>
                        <td className={cn(
                          "py-2.5 px-2 text-center tabular-nums hidden sm:table-cell",
                          entry.gameDifferential > 0 ? "text-emerald-400" : entry.gameDifferential < 0 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {entry.gameDifferential > 0 ? `+${entry.gameDifferential}` : entry.gameDifferential}
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums hidden lg:table-cell">
                          {(() => {
                            const records = h2hIndex.get(`${division.id}:${entry.teamId}`) ?? []
                            const w = records.reduce((s, r) => s + r.wins,   0)
                            const l = records.reduce((s, r) => s + r.losses, 0)
                            if (w === 0 && l === 0) return <span className="text-muted-foreground">—</span>
                            return (
                              <span className="text-xs">
                                <span className="text-emerald-400 font-semibold">{w}</span>
                                <span className="text-muted-foreground">-</span>
                                <span className="text-destructive font-semibold">{l}</span>
                              </span>
                            )
                          })() as React.ReactNode}
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums font-bold">{entry.points}</td>
                        <td className="py-2.5 pl-2 pr-4 text-center hidden md:table-cell">
                          <StreakBadge streak={entry.streak} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

          </section>
        )
      })}

    </div>
  )
}
