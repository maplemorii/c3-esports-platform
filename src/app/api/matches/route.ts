/**
 * /api/matches
 *
 * GET  — list matches with optional filters
 * POST — create/schedule a match (STAFF+)
 *
 * Query params (GET):
 *   divisionId  — filter by division
 *   weekId      — filter by league week
 *   status      — filter by MatchStatus enum value
 *   teamId      — filter matches where team is home or away
 *   upcoming    — if "true", only return matches with scheduledAt > now
 *   page        — 1-based (default: 1)
 *   limit       — max 100 (default: 25)
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { CreateMatchSchema } from "@/lib/validators/match.schema"
import { createMatch } from "@/lib/services/match.service"
import type { MatchStatus, Prisma } from "@prisma/client"

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  // Public — no auth required for list
  const { searchParams } = new URL(req.url)

  const divisionId = searchParams.get("divisionId") ?? undefined
  const weekId     = searchParams.get("weekId")     ?? undefined
  const status     = searchParams.get("status")     ?? undefined
  const teamId     = searchParams.get("teamId")     ?? undefined
  const upcoming   = searchParams.get("upcoming") === "true"
  const page       = Math.max(1, Number(searchParams.get("page")  ?? 1))
  const limit      = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 25)))

  const where: Prisma.MatchWhereInput = {
    deletedAt: null,
    ...(divisionId && { divisionId }),
    ...(weekId     && { leagueWeekId: weekId }),
    ...(status     && { status: status as MatchStatus }),
    ...(teamId     && {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    }),
    ...(upcoming && {
      scheduledAt: { gt: new Date() },
    }),
  }

  const [matches, total] = await prisma.$transaction([
    prisma.match.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id:               true,
        status:           true,
        format:           true,
        matchType:        true,
        scheduledAt:      true,
        checkInOpenAt:    true,
        checkInDeadlineAt: true,
        completedAt:      true,
        homeScore:        true,
        awayScore:        true,
        isBracketMatch:   true,
        homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        winner:   { select: { id: true, name: true, slug: true } },
        division: { select: { id: true, name: true, tier: true } },
        leagueWeek: { select: { id: true, weekNumber: true, startDate: true, endDate: true } },
      },
    }),
    prisma.match.count({ where }),
  ])

  return NextResponse.json({ matches, total, page, limit })
}

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const { session, error } = await requireRole("STAFF")
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = CreateMatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const match = await createMatch({
      divisionId:   parsed.data.divisionId,
      leagueWeekId: parsed.data.leagueWeekId,
      homeTeamId:   parsed.data.homeTeamId,
      awayTeamId:   parsed.data.awayTeamId,
      format:       parsed.data.format,
      matchType:    parsed.data.matchType,
      scheduledAt:  parsed.data.scheduledAt,
      notes:        parsed.data.notes,
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId:    session.user.id,
        action:     "MATCH_CREATED",
        entityType: "Match",
        entityId:   match.id,
        after:      { divisionId: match.divisionId, homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
      },
    })

    return NextResponse.json(match, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create match"
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
