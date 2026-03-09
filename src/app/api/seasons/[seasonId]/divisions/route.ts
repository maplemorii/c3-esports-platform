/**
 * /api/seasons/:seasonId/divisions
 *
 * GET  — public; list divisions for a season
 * POST — STAFF+; create a division for a season
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { CreateDivisionSchema } from "@/lib/validators/season.schema"
import { parseBody, apiNotFound, apiInternalError } from "@/lib/utils/errors"

type Ctx = { params: Promise<{ seasonId: string }> }

const DIVISION_SELECT = {
  id:          true,
  name:        true,
  tier:        true,
  description: true,
  maxTeams:    true,
  bracketType: true,
  createdAt:   true,
  _count:      { select: { registrations: true } },
} as const

// ---------------------------------------------------------------------------
// GET /api/seasons/:seasonId/divisions
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: Ctx
) {
  const { seasonId } = await params
  try {
    const season = await prisma.season.findUnique({
      where:  { id: seasonId },
      select: { id: true },
    })
    if (!season) return apiNotFound("Season")

    const divisions = await prisma.division.findMany({
      where:   { seasonId },
      orderBy: { tier: "asc" },
      select:  DIVISION_SELECT,
    })

    return NextResponse.json(divisions)
  } catch (err) {
    return apiInternalError(err, "GET /api/seasons/:seasonId/divisions")
  }
}

// ---------------------------------------------------------------------------
// POST /api/seasons/:seasonId/divisions
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: Ctx
) {
  const { seasonId } = await params

  const { error: authError } = await requireRole("STAFF")
  if (authError) return authError

  const { data, error: bodyError } = await parseBody(req, CreateDivisionSchema)
  if (bodyError) return bodyError

  try {
    const season = await prisma.season.findUnique({
      where:  { id: seasonId },
      select: { id: true },
    })
    if (!season) return apiNotFound("Season")

    const division = await prisma.division.create({
      data: {
        seasonId,
        name:        data.name,
        tier:        data.tier,
        description: data.description,
        maxTeams:    data.maxTeams,
        bracketType: data.bracketType,
      },
      select: DIVISION_SELECT,
    })

    return NextResponse.json(division, { status: 201 })
  } catch (err) {
    return apiInternalError(err, "POST /api/seasons/:seasonId/divisions")
  }
}