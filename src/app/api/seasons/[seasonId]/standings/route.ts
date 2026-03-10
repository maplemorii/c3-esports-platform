/**
 * /api/seasons/:seasonId/standings
 *
 * GET — public; returns standings for all divisions in the season,
 *       each division sorted by rank (points → gameDiff → goalDiff → gamesWon).
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiNotFound } from "@/lib/utils/errors"

type Params = { params: Promise<{ seasonId: string }> }

const STANDINGS_SELECT = {
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
    select: { id: true, name: true, slug: true, logoUrl: true },
  },
} as const

export async function GET(_req: Request, { params }: Params) {
  const { seasonId } = await params

  const season = await prisma.season.findUnique({
    where:  { id: seasonId },
    select: { id: true },
  })
  if (!season) return apiNotFound("Season")

  const divisions = await prisma.division.findMany({
    where:   { seasonId },
    orderBy: { tier: "asc" },
    select: {
      id:   true,
      name: true,
      tier: true,
      standingEntries: {
        orderBy: [
          { points:           "desc" },
          { gameDifferential: "desc" },
          { goalDifferential: "desc" },
          { gamesWon:         "desc" },
        ],
        select: STANDINGS_SELECT,
      },
    },
  })

  const payload = divisions.map((div) => ({
    divisionId:   div.id,
    divisionName: div.name,
    tier:         div.tier,
    standings:    div.standingEntries.map((entry, i) => ({
      rank: i + 1,
      ...entry,
    })),
  }))

  return NextResponse.json(payload)
}
