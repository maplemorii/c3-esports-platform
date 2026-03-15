/**
 * GET /api/bot/disputes
 * List disputes for the Discord bot. Bot auth required.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const authError = requireBotAuth(req)
  if (authError) return authError

  const { searchParams } = req.nextUrl
  const status = searchParams.get("status") ?? "open"
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "25"), 100)

  const statusMap: Record<string, string[]> = {
    open:     ["OPEN"],
    resolved: ["RESOLVED"],
    dismissed:["DISMISSED"],
  }
  const statuses = statusMap[status] ?? ["OPEN"]

  const disputes = await prisma.dispute.findMany({
    where:   { status: { in: statuses as never[] } },
    take:    limit,
    orderBy: { createdAt: "asc" },
    select: {
      id:            true,
      status:        true,
      createdAt:     true,
      matchId:       true,
      filedByTeamId: true,
      match: {
        select: {
          homeTeamId: true,
          awayTeamId: true,
          homeTeam:   { select: { name: true } },
          awayTeam:   { select: { name: true } },
        },
      },
    },
  })

  const formatted = disputes.map((d) => {
    const filedByName =
      d.filedByTeamId === d.match?.homeTeamId ? d.match?.homeTeam?.name :
      d.filedByTeamId === d.match?.awayTeamId ? d.match?.awayTeam?.name :
      d.filedByTeamId
    return {
      id:        d.id,
      matchId:   d.matchId,
      homeTeam:  d.match?.homeTeam?.name,
      awayTeam:  d.match?.awayTeam?.name,
      filedBy:   filedByName,
      filedAt:   d.createdAt,
      status:    d.status.toLowerCase(),
    }
  })

  return NextResponse.json({ disputes: formatted, total: formatted.length })
}
