/**
 * GET /api/v1/matches
 *
 * Public — no auth required.
 * Paginated match list with filters.
 *
 * Query params:
 *   divisionId  — filter by division
 *   weekId      — filter by league week
 *   status      — MatchStatus enum value
 *   teamId      — matches where team is home or away
 *   upcoming    — "true" → only scheduledAt > now
 *   page        — 1-based (default: 1)
 *   limit       — max 100 (default: 25)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiInternalError } from "@/lib/utils/errors"
import { v1RateLimit, attachRateLimitHeaders } from "@/lib/api/v1RateLimit"
import type { MatchStatus, Prisma } from "@prisma/client"

export async function GET(req: Request) {
  const rl = await v1RateLimit(req)
  if (rl.blocked) return rl.blocked

  try {
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
      ...(teamId     && { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] }),
      ...(upcoming   && { scheduledAt: { gt: new Date() } }),
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        orderBy: { scheduledAt: "asc" },
        skip:    (page - 1) * limit,
        take:    limit,
        select: {
          id:                true,
          status:            true,
          format:            true,
          matchType:         true,
          scheduledAt:       true,
          completedAt:       true,
          homeScore:         true,
          awayScore:         true,
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          winner:   { select: { id: true, name: true, slug: true } },
          division: { select: { id: true, name: true, tier: true } },
          leagueWeek: { select: { id: true, weekNumber: true } },
        },
      }),
      prisma.match.count({ where }),
    ])

    const payload = {
      data:       matches,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }

    return attachRateLimitHeaders(NextResponse.json(payload), rl.remaining)
  } catch (err) {
    return apiInternalError(err, "GET /api/v1/matches")
  }
}
