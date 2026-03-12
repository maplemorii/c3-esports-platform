/**
 * /admin/standings
 *
 * Standings management — pick a season and division, view standings table,
 * and trigger a full recalculation.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { BarChart3, TrendingUp } from "lucide-react"
import { RecalculateButton } from "./_components/RecalculateButton"
import type { DivisionTier } from "@prisma/client"

export const metadata: Metadata = { title: "Standings — Staff" }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:     "Premier",
  CHALLENGERS: "Challengers",
  CONTENDERS:  "Contenders",
}

const TIER_CLS: Record<DivisionTier, string> = {
  PREMIER:     "text-amber-400",
  CHALLENGERS: "text-sky-400",
  CONTENDERS:  "text-emerald-400",
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getSeasons() {
  return prisma.season.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id:   true,
      name: true,
      status: true,
      divisions: {
        orderBy: { tier: "asc" },
        select: {
          id:   true,
          name: true,
          tier: true,
          _count: { select: { standingEntries: true } },
        },
      },
    },
  })
}

async function getDivisionStandings(divisionId: string) {
  return prisma.division.findUnique({
    where:  { id: divisionId },
    select: {
      id:   true,
      name: true,
      tier: true,
      season: { select: { id: true, name: true } },
      standingEntries: {
        orderBy: [
          { points:           "desc" },
          { gameDifferential: "desc" },
          { goalDifferential: "desc" },
          { gamesWon:         "desc" },
        ],
        select: {
          id:               true,
          wins:             true,
          losses:           true,
          matchesPlayed:    true,
          forfeitWins:      true,
          forfeitLosses:    true,
          gamesWon:         true,
          gamesLost:        true,
          gameDifferential: true,
          goalsFor:         true,
          goalsAgainst:     true,
          goalDifferential: true,
          points:           true,
          streak:           true,
          lastUpdated:      true,
          team: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminStandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ seasonId?: string; divisionId?: string }>
}) {
  const { seasonId, divisionId } = await searchParams

  const [seasons, division] = await Promise.all([
    getSeasons(),
    divisionId ? getDivisionStandings(divisionId) : null,
  ])

  // Determine which season is selected (default to first)
  const selectedSeasonId = seasonId ?? seasons[0]?.id
  const selectedSeason   = seasons.find((s) => s.id === selectedSeasonId)

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (selectedSeasonId) p.set("seasonId", selectedSeasonId)
    if (divisionId)       p.set("divisionId", divisionId)
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k)
    })
    const s = p.toString()
    return `/admin/standings${s ? `?${s}` : ""}`
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Page header card */}
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
          Staff Panel
        </p>
        <h1 className="font-display text-3xl font-black uppercase tracking-wide">Standings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and recalculate standings per division.
        </p>
      </div>

      {/* Season tabs */}
      <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {seasons.map((s) => (
          <Link
            key={s.id}
            href={buildUrl({ seasonId: s.id, divisionId: undefined })}
            className={cn(
              "shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              selectedSeasonId === s.id
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {/* Division selector */}
      {selectedSeason && selectedSeason.divisions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {selectedSeason.divisions.map((d) => (
            <Link
              key={d.id}
              href={buildUrl({ seasonId: selectedSeasonId, divisionId: d.id })}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm transition-colors",
                divisionId === d.id
                  ? "border-brand bg-brand/10"
                  : "border-border bg-card hover:border-brand/40",
              )}
            >
              <p className={cn("font-semibold", divisionId === d.id ? "text-brand" : TIER_CLS[d.tier])}>
                {TIER_LABEL[d.tier]}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{d.name}</p>
              <p className="text-xs text-muted-foreground/60">{d._count.standingEntries} teams</p>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state — no division selected */}
      {!division && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Select a division above to view standings.</p>
        </div>
      )}

      {/* Standings table */}
      {division && (
        <div className="space-y-4">
          {/* Sub-header with recalculate */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">
                {division.season.name} · {division.name}
              </h2>
              <span className={cn("text-xs font-medium", TIER_CLS[division.tier])}>
                {TIER_LABEL[division.tier]}
              </span>
            </div>
            <RecalculateButton divisionId={division.id} />
          </div>

          {division.standingEntries.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-muted-foreground text-sm">No standing entries yet for this division.</p>
            </div>
          ) : (
            <div
              className="relative overflow-hidden rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Table header */}
              <div
                className="grid grid-cols-[2rem_1fr_repeat(8,minmax(3rem,auto))] gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span>#</span>
                <span>Team</span>
                <span className="text-center">MP</span>
                <span className="text-center">W</span>
                <span className="text-center">L</span>
                <span className="text-center">GW</span>
                <span className="text-center">GL</span>
                <span className="text-center">GF</span>
                <span className="text-center">GA</span>
                <span className="text-center font-bold text-foreground/70">PTS</span>
              </div>

              {/* Rows */}
              <div>
                {division.standingEntries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[2rem_1fr_repeat(8,minmax(3rem,auto))] gap-2 px-4 py-3 items-center hover:bg-white/3 transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</span>

                    <div className="min-w-0">
                      <Link
                        href={`/teams/${entry.team.slug}`}
                        className="text-sm font-semibold hover:text-brand transition-colors truncate block"
                      >
                        {entry.team.name}
                      </Link>
                      {entry.streak && (
                        <p className="text-[10px] text-muted-foreground/60">{entry.streak}</p>
                      )}
                    </div>

                    <span className="text-xs tabular-nums text-center">{entry.matchesPlayed}</span>
                    <span className="text-xs tabular-nums text-center text-emerald-400">{entry.wins}</span>
                    <span className="text-xs tabular-nums text-center text-destructive">{entry.losses}</span>
                    <span className="text-xs tabular-nums text-center">{entry.gamesWon}</span>
                    <span className="text-xs tabular-nums text-center text-muted-foreground">{entry.gamesLost}</span>
                    <span className="text-xs tabular-nums text-center">{entry.goalsFor}</span>
                    <span className="text-xs tabular-nums text-center text-muted-foreground">{entry.goalsAgainst}</span>
                    <span className="text-xs tabular-nums text-center font-bold font-display">{entry.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            MP = Matches Played · W = Wins · L = Losses · GW = Games Won · GL = Games Lost · GF = Goals For · GA = Goals Against · PTS = Points
          </p>
        </div>
      )}

    </div>
  )
}
