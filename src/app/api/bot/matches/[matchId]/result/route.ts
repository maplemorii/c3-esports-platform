/**
 * PATCH /api/bot/matches/:matchId/result
 * Staff score override via bot. Bot auth required.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"
import { applyMatchToStandings, reverseMatchFromStandings } from "@/lib/services/standings.service"
import { z } from "zod"

const GameSchema = z.object({
  gameNumber: z.number().int().min(1),
  homeGoals:  z.number().int().min(0),
  awayGoals:  z.number().int().min(0),
  overtime:   z.boolean().optional().default(false),
})

const Schema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  games:     z.array(GameSchema).min(1),
  reason:    z.string().min(1),
})

type Params = { params: Promise<{ matchId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireBotAuth(req)
  if (authError) return authError

  const { matchId } = await params

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 422 })

  const { homeScore, awayScore, games, reason } = parsed.data

  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: { status: true, homeTeamId: true, awayTeamId: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
  })

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  if (match.status === "COMPLETED") {
    await reverseMatchFromStandings(matchId)
  }

  const winnerId   = homeScore > awayScore ? match.homeTeamId : match.awayTeamId
  const winnerName = homeScore > awayScore ? match.homeTeam?.name : match.awayTeam?.name

  await Promise.all(
    games.map((g) =>
      prisma.matchGame.upsert({
        where:  { matchId_gameNumber: { matchId, gameNumber: g.gameNumber } },
        create: { matchId, gameNumber: g.gameNumber, homeGoals: g.homeGoals, awayGoals: g.awayGoals, overtime: g.overtime, source: "STAFF_OVERRIDE" },
        update: { homeGoals: g.homeGoals, awayGoals: g.awayGoals, overtime: g.overtime, source: "STAFF_OVERRIDE" },
      })
    )
  )

  await prisma.match.update({
    where: { id: matchId },
    data:  { status: "COMPLETED", completedAt: new Date(), homeScore, awayScore, winnerId },
  })

  await prisma.auditLog.create({
    data: {
      action:     "STAFF_RESULT_OVERRIDE",
      entityType: "Match",
      entityId:   matchId,
      after:      { homeScore, awayScore, winnerId, reason, source: "discord_bot" },
    },
  })

  await applyMatchToStandings(matchId)

  return NextResponse.json({ ok: true, homeScore, awayScore, winnerId, winnerName })
}
