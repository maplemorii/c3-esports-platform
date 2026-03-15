/**
 * GET /api/bot/matches/:matchId
 * Single match lookup for the Discord bot. Bot auth required.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ matchId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireBotAuth(req)
  if (authError) return authError

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
      homeTeam:    { select: { id: true, name: true, slug: true } },
      awayTeam:    { select: { id: true, name: true, slug: true } },
      winner:      { select: { id: true, name: true, slug: true } },
      division:    { select: { id: true, name: true, tier: true } },
      leagueWeek:  { select: { weekNumber: true } },
      games:       { orderBy: { gameNumber: "asc" }, select: { gameNumber: true, homeGoals: true, awayGoals: true, overtime: true, source: true } },
    },
  })

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  return NextResponse.json(match)
}
