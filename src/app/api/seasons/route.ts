/**
 * /api/seasons
 *
 * GET  — public; list visible seasons with their divisions
 *         Query params: status (DRAFT|REGISTRATION|ACTIVE|PLAYOFFS|COMPLETED|CANCELLED)
 *
 * POST — STAFF+; create a new season (status defaults to DRAFT)
 *         Auto-creates the three standard divisions.
 *         Enforces: only one season may have status ACTIVE at a time.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { CreateSeasonSchema } from "@/lib/validators/season.schema"
import { parseBody, apiConflict, apiInternalError } from "@/lib/utils/errors"
import { slugify, dedupeSlug } from "@/lib/utils/slug"
import type { SeasonStatus } from "@prisma/client"

const VALID_STATUSES: SeasonStatus[] = [
  "DRAFT", "REGISTRATION", "ACTIVE", "PLAYOFFS", "COMPLETED", "CANCELLED",
]

// Shared select used by GET list, POST response, and [seasonId] route
export const SEASON_SELECT = {
  id:                true,
  slug:              true,
  name:              true,
  status:            true,
  description:       true,
  isVisible:         true,
  registrationStart: true,
  registrationEnd:   true,
  startDate:         true,
  endDate:           true,
  leagueWeeks:          true,
  checkInWindowMinutes: true,
  checkInGraceMinutes:  true,
  resultWindowHours:    true,
  pointsConfig:         true,
  maxTeamsTotal:        true,
  rosterLockAt:         true,
  createdAt:            true,
  updatedAt:            true,
  divisions: {
    orderBy: { tier: "asc" as const },
    select: {
      id:          true,
      name:        true,
      tier:        true,
      description: true,
      maxTeams:    true,
      bracketType: true,
      _count:      { select: { registrations: true } },
    },
  },
} as const

// ---------------------------------------------------------------------------
// GET /api/seasons
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const statusParam = searchParams.get("status")?.toUpperCase()

    const statusFilter: SeasonStatus | undefined =
      statusParam && VALID_STATUSES.includes(statusParam as SeasonStatus)
        ? (statusParam as SeasonStatus)
        : undefined

    const seasons = await prisma.season.findMany({
      where: {
        isVisible: true,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" as const },
      select:  SEASON_SELECT,
    })

    return NextResponse.json(seasons)
  } catch (err) {
    return apiInternalError(err, "GET /api/seasons")
  }
}

// ---------------------------------------------------------------------------
// POST /api/seasons
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireRole("STAFF")
  if (authError) return authError
  void session

  const { data, error: bodyError } = await parseBody(req, CreateSeasonSchema)
  if (bodyError) return bodyError

  try {
    // Enforce single-ACTIVE constraint at creation time
    if ((data as { status?: string }).status === "ACTIVE") {
      const existingActive = await prisma.season.findFirst({
        where:  { status: "ACTIVE" },
        select: { id: true, name: true },
      })
      if (existingActive) {
        return apiConflict(
          `"${existingActive.name}" is already ACTIVE. Only one season may be active at a time.`
        )
      }
    }

    // Resolve slug
    const candidate = data.slug ?? slugify(data.name)
    const allSlugs  = await prisma.season.findMany({ select: { slug: true } })
    const slug      = dedupeSlug(candidate, allSlugs.map((s) => s.slug))

    const season = await prisma.season.create({
      data: {
        slug,
        name:              data.name,
        description:       data.description,
        startDate:         data.startDate,
        endDate:           data.endDate,
        registrationStart: data.registrationStart,
        registrationEnd:   data.registrationEnd,
        leagueWeeks:          data.leagueWeeks,
        checkInWindowMinutes: data.checkInWindowMinutes,
        checkInGraceMinutes:  data.checkInGraceMinutes,
        resultWindowHours:    data.resultWindowHours,
        pointsConfig:         data.pointsConfig as object | undefined,
        maxTeamsTotal:        data.maxTeamsTotal,
        isVisible:            data.isVisible,
        // Auto-create the three standard divisions
        divisions: {
          create: [
            { name: "Premier",          tier: "PREMIER",     bracketType: "DOUBLE_ELIMINATION" },
            { name: "Open Challengers", tier: "CHALLENGERS", bracketType: "DOUBLE_ELIMINATION" },
            { name: "Open Contenders",  tier: "CONTENDERS",  bracketType: "DOUBLE_ELIMINATION" },
          ],
        },
      },
      select: SEASON_SELECT,
    })

    return NextResponse.json(season, { status: 201 })
  } catch (err) {
    return apiInternalError(err, "POST /api/seasons")
  }
}
