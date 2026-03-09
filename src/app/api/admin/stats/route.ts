/**
 * GET /api/admin/stats
 * Returns platform-wide summary stats for the admin overview dashboard.
 * Requires STAFF or above.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"

export async function GET() {
  const { error } = await requireRole("STAFF")
  if (error) return error

  const [
    totalUsers,
    totalTeams,
    activeSeasons,
    pendingRegistrations,
    totalMatches,
    completedMatches,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.team.count({ where: { deletedAt: null } }),
    prisma.season.count({ where: { status: { in: ["REGISTRATION", "ACTIVE", "PLAYOFFS"] } } }),
    prisma.seasonRegistration.count({ where: { status: { in: ["PENDING", "WAITLISTED"] } } }),
    prisma.match.count({ where: { deletedAt: null } }),
    prisma.match.count({ where: { status: "COMPLETED", deletedAt: null } }),
  ])

  return NextResponse.json({
    totalUsers,
    totalTeams,
    activeSeasons,
    pendingRegistrations,
    totalMatches,
    completedMatches,
  })
}
