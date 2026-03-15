/**
 * GET /api/bot/registrations
 * List season registrations for the Discord bot. Bot auth required.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const authError = requireBotAuth(req)
  if (authError) return authError

  const { searchParams } = req.nextUrl
  const status   = (searchParams.get("status") ?? "PENDING").toUpperCase()
  const seasonId = searchParams.get("seasonId") ?? undefined

  // Default to active season if no seasonId given
  let resolvedSeasonId = seasonId
  if (!resolvedSeasonId) {
    const active = await prisma.season.findFirst({
      where:   { status: { in: ["REGISTRATION", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
      select:  { id: true },
    })
    resolvedSeasonId = active?.id
  }

  if (!resolvedSeasonId) {
    return NextResponse.json({ registrations: [], total: 0 })
  }

  const regs = await prisma.seasonRegistration.findMany({
    where:   { seasonId: resolvedSeasonId, status: status as never },
    orderBy: { registeredAt: "asc" },
    select: {
      id:           true,
      status:       true,
      registeredAt: true,
      team:     { select: { id: true, name: true, slug: true } },
      division: { select: { name: true } },
    },
  })

  // Get roster sizes separately
  const teamIds = regs.map((r) => r.team.id)
  const rosterCounts = await prisma.teamMembership.groupBy({
    by:    ["teamId"],
    where: { teamId: { in: teamIds }, leftAt: null },
    _count: { _all: true },
  })
  const rosterMap = Object.fromEntries(rosterCounts.map((r) => [r.teamId, r._count._all]))

  const formatted = regs.map((r) => ({
    id:           r.id,
    teamId:       r.team.id,
    teamName:     r.team.name,
    teamSlug:     r.team.slug,
    divisionName: r.division?.name ?? null,
    rosterSize:   rosterMap[r.team.id] ?? 0,
    status:       r.status,
    registeredAt: r.registeredAt,
  }))

  return NextResponse.json({ registrations: formatted, total: formatted.length })
}
