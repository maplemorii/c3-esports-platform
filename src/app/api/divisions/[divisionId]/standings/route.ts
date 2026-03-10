/**
 * /api/divisions/:divisionId/standings
 *
 * GET — public; ranked standings for a single division.
 *       Rows are sorted with full H2H tiebreaking applied in JS.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiNotFound } from "@/lib/utils/errors"
import { sortStandingsWithH2H } from "@/types/standings"
import type { StandingsRow } from "@/types/standings"

type Params = { params: Promise<{ divisionId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { divisionId } = await params

  const division = await prisma.division.findUnique({
    where:  { id: divisionId },
    select: {
      id:   true,
      name: true,
      tier: true,
      season: { select: { id: true, name: true, slug: true } },
      standingEntries: {
        // Pre-sort by points desc so ties are already grouped together
        orderBy: [
          { points:           "desc" },
          { gameDifferential: "desc" },
          { goalDifferential: "desc" },
          { gamesWon:         "desc" },
        ],
        select: {
          id:               true,
          teamId:           true,
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
          winPct:           true,
          lastUpdated:      true,
          team: {
            select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
          },
        },
      },
    },
  })

  if (!division) return apiNotFound("Division")

  // Fetch H2H records for this division
  const h2hRecords = await prisma.headToHeadRecord.findMany({
    where:  { divisionId },
    select: { teamId: true, opponentId: true, wins: true, losses: true, gamesWon: true, gamesLost: true, points: true },
  })

  type H2HRow = (typeof h2hRecords)[number]

  // Index H2H by teamId for fast lookup
  const h2hByTeam = new Map<string, H2HRow[]>()
  for (const r of h2hRecords) {
    const list = h2hByTeam.get(r.teamId) ?? []
    list.push(r)
    h2hByTeam.set(r.teamId, list)
  }

  // Build StandingsRow array with h2h attached
  const rows: StandingsRow[] = division.standingEntries.map((entry) => ({
    ...entry,
    rank:        0,   // assigned after sort
    lastUpdated: entry.lastUpdated.toISOString(),
    h2h: (h2hByTeam.get(entry.teamId) ?? []).map((r: H2HRow) => ({
      opponentId: r.opponentId,
      wins:       r.wins,
      losses:     r.losses,
      gamesWon:   r.gamesWon,
      gamesLost:  r.gamesLost,
      points:     r.points,
    })),
  }))

  const sorted = sortStandingsWithH2H(rows).map((row, i) => ({ ...row, rank: i + 1 }))

  return NextResponse.json({
    divisionId:   division.id,
    divisionName: division.name,
    tier:         division.tier,
    season:       division.season,
    standings:    sorted,
  })
}
