/**
 * GET /api/v1/seasons/:slug/standings
 *
 * Public — no auth required.
 * Returns standings for ALL divisions in a season in a single response.
 * Useful for Discord bots and stat sites that need a complete season snapshot.
 *
 * Response shape:
 * {
 *   season: { id, slug, name, status },
 *   divisions: [
 *     {
 *       id, name, tier,
 *       standings: [{ rank, teamId, team, wins, losses, ... }, ...]
 *     }, ...
 *   ]
 * }
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiNotFound, apiInternalError } from "@/lib/utils/errors"
import { v1RateLimit, attachRateLimitHeaders } from "@/lib/api/v1RateLimit"
import { sortStandingsWithH2H } from "@/types/standings"
import type { StandingsRow } from "@/types/standings"

type Params = { params: Promise<{ slug: string }> }

export async function GET(req: Request, { params }: Params) {
  const rl = await v1RateLimit(req)
  if (rl.blocked) return rl.blocked

  const { slug } = await params

  try {
    const season = await prisma.season.findUnique({
      where:  { slug, isVisible: true },
      select: {
        id:     true,
        slug:   true,
        name:   true,
        status: true,
        divisions: {
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

    if (!season) return apiNotFound("Season")

    // Fetch all H2H records for every division in this season in one query
    const divisionIds = season.divisions.map((d) => d.id)
    const allH2H = await prisma.headToHeadRecord.findMany({
      where:  { divisionId: { in: divisionIds } },
      select: {
        divisionId: true,
        teamId:     true,
        opponentId: true,
        wins:       true,
        losses:     true,
        gamesWon:   true,
        gamesLost:  true,
        points:     true,
      },
    })

    // Index H2H by divisionId → teamId → [records]
    type H2HRow = (typeof allH2H)[number]
    const h2hByDiv = new Map<string, Map<string, H2HRow[]>>()
    for (const r of allH2H) {
      let byTeam = h2hByDiv.get(r.divisionId)
      if (!byTeam) { byTeam = new Map(); h2hByDiv.set(r.divisionId, byTeam) }
      const list = byTeam.get(r.teamId) ?? []
      list.push(r)
      byTeam.set(r.teamId, list)
    }

    const divisions = season.divisions.map((div) => {
      const byTeam = h2hByDiv.get(div.id) ?? new Map<string, H2HRow[]>()

      const rows: StandingsRow[] = div.standingEntries.map((entry) => ({
        ...entry,
        rank:        0,
        lastUpdated: entry.lastUpdated.toISOString(),
        h2h: (byTeam.get(entry.teamId) ?? []).map((r) => ({
          opponentId: r.opponentId,
          wins:       r.wins,
          losses:     r.losses,
          gamesWon:   r.gamesWon,
          gamesLost:  r.gamesLost,
          points:     r.points,
        })),
      }))

      const standings = sortStandingsWithH2H(rows).map((row, i) => ({ ...row, rank: i + 1 }))

      return { id: div.id, name: div.name, tier: div.tier, standings }
    })

    const payload = {
      season:    { id: season.id, slug: season.slug, name: season.name, status: season.status },
      divisions,
    }

    return attachRateLimitHeaders(NextResponse.json(payload), rl.remaining)
  } catch (err) {
    return apiInternalError(err, "GET /api/v1/seasons/:slug/standings")
  }
}
