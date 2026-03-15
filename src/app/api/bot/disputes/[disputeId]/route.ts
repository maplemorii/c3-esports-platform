/**
 * PATCH /api/bot/disputes/:disputeId
 * Resolve or dismiss a dispute via the Discord bot. Bot auth required.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"
import { applyMatchToStandings, reverseMatchFromStandings } from "@/lib/services/standings.service"
import { z } from "zod"

const Schema = z.object({
  outcome:           z.enum(["home_wins", "away_wins", "dismissed"]),
  reason:            z.string().min(1),
  resolvedHomeScore: z.number().int().min(0).optional(),
  resolvedAwayScore: z.number().int().min(0).optional(),
})

type Params = { params: Promise<{ disputeId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireBotAuth(req)
  if (authError) return authError

  const { disputeId } = await params

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 422 })

  const { outcome, reason, resolvedHomeScore, resolvedAwayScore } = parsed.data

  const dispute = await prisma.dispute.findUnique({
    where:  { id: disputeId },
    select: {
      id:      true,
      status:  true,
      matchId: true,
      match: {
        select: {
          status:     true,
          homeTeamId: true,
          awayTeamId: true,
          homeTeam:   { select: { name: true } },
          awayTeam:   { select: { name: true } },
        },
      },
    },
  })

  if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
  if (dispute.status === "RESOLVED" || dispute.status === "DISMISSED") {
    return NextResponse.json({ error: `Dispute is already ${dispute.status}` }, { status: 409 })
  }

  const now    = new Date()
  const action = outcome === "dismissed" ? "DISMISSED" : "RESOLVED"

  let winnerId:   string | undefined
  let winnerName: string | undefined

  if (outcome === "home_wins") {
    winnerId   = dispute.match.homeTeamId
    winnerName = dispute.match.homeTeam?.name
  } else if (outcome === "away_wins") {
    winnerId   = dispute.match.awayTeamId
    winnerName = dispute.match.awayTeam?.name
  }

  await prisma.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status:            action,
        resolution:        reason,
        resolvedAt:        now,
        resolvedHomeScore: resolvedHomeScore ?? null,
        resolvedAwayScore: resolvedAwayScore ?? null,
      },
    })

    if (action === "RESOLVED" && winnerId) {
      if (dispute.match.status === "COMPLETED") {
        await reverseMatchFromStandings(dispute.matchId)
      }

      const homeScore = resolvedHomeScore ?? (outcome === "home_wins" ? 1 : 0)
      const awayScore = resolvedAwayScore ?? (outcome === "away_wins" ? 1 : 0)

      await tx.match.update({
        where: { id: dispute.matchId },
        data:  { status: "COMPLETED", completedAt: now, homeScore, awayScore, winnerId },
      })
    } else {
      await tx.match.update({
        where: { id: dispute.matchId },
        data:  { status: "COMPLETED", completedAt: now },
      })
    }

    const botUser = await tx.user.findFirst({ where: { email: "bot@c3esports.com" }, select: { id: true } })
    if (botUser) {
      await tx.auditLog.create({
        data: {
          actorId:    botUser.id,
          action:     `DISPUTE_${action}`,
          entityType: "Dispute",
          entityId:   disputeId,
          after:      { outcome, reason, source: "discord_bot" },
        },
      })
    }
  })

  if (action === "RESOLVED") {
    await applyMatchToStandings(dispute.matchId)
  }

  return NextResponse.json({ ok: true, outcome, winnerId, winnerName })
}
