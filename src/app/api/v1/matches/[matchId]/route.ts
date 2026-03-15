/**
 * GET /api/v1/matches/:matchId
 *
 * Public — no auth required.
 * Single match lookup by ID.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiNotFound, apiInternalError } from "@/lib/utils/errors"
import { v1RateLimit, attachRateLimitHeaders } from "@/lib/api/v1RateLimit"

type Params = { params: Promise<{ matchId: string }> }

export async function GET(req: Request, { params }: Params) {
  const rl = await v1RateLimit(req)
  if (rl.blocked) return rl.blocked

  try {
    const { matchId } = await params

    const match = await prisma.match.findUnique({
      where:  { id: matchId, deletedAt: null },
      select: {
        id:          true,
        status:      true,
        format:      true,
        matchType:   true,
        scheduledAt: true,
        completedAt: true,
        homeScore:   true,
        awayScore:   true,
        homeTeam:    { select: { id: true, name: true, slug: true, logoUrl: true } },
        awayTeam:    { select: { id: true, name: true, slug: true, logoUrl: true } },
        winner:      { select: { id: true, name: true, slug: true } },
        division:    { select: { id: true, name: true, tier: true } },
        leagueWeek:  { select: { id: true, weekNumber: true } },
        games: {
          select:  { gameNumber: true, homeGoals: true, awayGoals: true, overtime: true, source: true },
          orderBy: { gameNumber: "asc" },
        },
      },
    })

    if (!match) return apiNotFound("Match")

    return attachRateLimitHeaders(NextResponse.json(match), rl.remaining)
  } catch (err) {
    return apiInternalError(err, "GET /api/v1/matches/:matchId")
  }
}
