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
      id:           true,
      status:       true,
      createdAt:    true,
      matchId:      true,
      filedByTeamId: true,
      match: {
        select: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
      filedByTeam: { select: { name: true } },
      reports: {
        select: {
          submittingTeamId: true,
          reportedHomeScore: true,
          reportedAwayScore: true,
        },
      },
    },
  })

  const formatted = disputes.map((d) => {
    const homeReport = d.reports.find((r) => r.submittingTeamId === d.match?.homeTeam ? undefined : undefined)
    return {
      id:          d.id,
      matchId:     d.matchId,
      homeTeam:    d.match?.homeTeam?.name,
      awayTeam:    d.match?.awayTeam?.name,
      filedBy:     d.filedByTeam?.name,
      filedAt:     d.createdAt,
      status:      d.status.toLowerCase(),
      homeTeamScore: homeReport ? { home: homeReport.reportedHomeScore, away: homeReport.reportedAwayScore } : null,
    }
  })

  return NextResponse.json({ disputes: formatted, total: formatted.length })
}
