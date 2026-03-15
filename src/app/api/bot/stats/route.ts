/**
 * GET /api/bot/stats
 * Platform stats for the Discord bot /stats command. Bot auth required.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const authError = requireBotAuth(req)
  if (authError) return authError

  const [
    totalUsers,
    totalTeams,
    activeSeasons,
    pendingRegistrations,
    totalMatches,
    completedMatches,
    openDisputes,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.team.count({ where: { deletedAt: null } }),
    prisma.season.count({ where: { status: { in: ["REGISTRATION", "ACTIVE", "PLAYOFFS"] } } }),
    prisma.seasonRegistration.count({ where: { status: { in: ["PENDING", "WAITLISTED"] } } }),
    prisma.match.count({ where: { deletedAt: null } }),
    prisma.match.count({ where: { status: "COMPLETED", deletedAt: null } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
  ])

  return NextResponse.json({
    totalUsers,
    totalTeams,
    activeSeasons,
    pendingRegistrations,
    totalMatches,
    completedMatches,
    openDisputes,
  })
}
