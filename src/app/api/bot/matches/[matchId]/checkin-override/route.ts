/**
 * POST /api/bot/matches/:matchId/checkin-override
 * Force check-in a team for a match. Bot auth required.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"
import { CheckInStatus, MatchStatus } from "@prisma/client"
import { z } from "zod"

const Schema = z.object({
  team:   z.enum(["home", "away"]),
  reason: z.string().optional(),
})

type Params = { params: Promise<{ matchId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireBotAuth(req)
  if (authError) return authError

  const { matchId } = await params

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 422 })

  const { team } = parsed.data

  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: { status: true, homeTeamId: true, awayTeamId: true },
  })

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })
  if (match.status !== MatchStatus.CHECKING_IN) {
    return NextResponse.json({ error: "Match is not in check-in phase" }, { status: 409 })
  }

  const teamId = team === "home" ? match.homeTeamId : match.awayTeamId

  const existing = await prisma.matchCheckIn.findFirst({
    where: { matchId, teamId },
  })

  if (existing?.status === CheckInStatus.CHECKED_IN) {
    return NextResponse.json({ error: "Team is already checked in" }, { status: 409 })
  }

  await prisma.matchCheckIn.upsert({
    where:  { matchId_teamId: { matchId, teamId } },
    update: { status: CheckInStatus.CHECKED_IN, checkedInAt: new Date() },
    create: { matchId, teamId, status: CheckInStatus.CHECKED_IN, checkedInAt: new Date() },
  })

  const teamRecord = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } })

  return NextResponse.json({ ok: true, teamId, teamName: teamRecord?.name })
}
