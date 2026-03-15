/**
 * POST /api/bot/matches/:matchId/forfeit
 * Award a forfeit. Bot auth required.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"
import { applyMatchToStandings } from "@/lib/services/standings.service"
import { z } from "zod"

const Schema = z.object({
  forfeitingTeam: z.enum(["home", "away"]),
  reason:         z.string().min(1),
})

type Params = { params: Promise<{ matchId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireBotAuth(req)
  if (authError) return authError

  const { matchId } = await params

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 422 })

  const { forfeitingTeam, reason } = parsed.data

  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: {
      status:     true,
      homeTeamId: true,
      awayTeamId: true,
      homeTeam:   { select: { name: true } },
      awayTeam:   { select: { name: true } },
    },
  })

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  const terminal = ["COMPLETED", "CANCELLED", "FORFEITED", "NO_SHOW"]
  if (terminal.includes(match.status)) {
    return NextResponse.json({ error: `Match is already ${match.status}` }, { status: 409 })
  }

  const forfeitingTeamId = forfeitingTeam === "home" ? match.homeTeamId : match.awayTeamId
  const winnerId         = forfeitingTeam === "home" ? match.awayTeamId : match.homeTeamId
  const winnerName       = forfeitingTeam === "home" ? match.awayTeam?.name : match.homeTeam?.name
  const loserName        = forfeitingTeam === "home" ? match.homeTeam?.name : match.awayTeam?.name

  await prisma.match.update({
    where: { id: matchId },
    data:  { status: "FORFEITED", winnerId, completedAt: new Date(), notes: reason },
  })

  await applyMatchToStandings(matchId)

  return NextResponse.json({
    ok:       true,
    winnerId,
    winnerName,
    loserId:  forfeitingTeamId,
    loserName,
  })
}
