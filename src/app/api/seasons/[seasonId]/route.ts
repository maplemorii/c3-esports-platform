/**
 * /api/seasons/:seasonId
 *
 * GET    — public; season detail with divisions
 * PATCH  — STAFF+; update season fields
 *           Enforces: only one season may have status ACTIVE at a time.
 * DELETE — ADMIN; hard-delete a DRAFT season (blocked if it has registrations)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { UpdateSeasonSchema } from "@/lib/validators/season.schema"
import {
  parseBody,
  apiNotFound,
  apiBadRequest,
  apiConflict,
  apiInternalError,
} from "@/lib/utils/errors"
import { SEASON_SELECT } from "@/app/api/seasons/route"

type Ctx = { params: Promise<{ seasonId: string }> }

// ---------------------------------------------------------------------------
// GET /api/seasons/:seasonId
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: Ctx
) {
  const { seasonId } = await params
  try {
    const season = await prisma.season.findUnique({
      where:  { id: seasonId },
      select: SEASON_SELECT,
    })
    if (!season) return apiNotFound("Season")
    return NextResponse.json(season)
  } catch (err) {
    return apiInternalError(err, "GET /api/seasons/:seasonId")
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/seasons/:seasonId
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: Ctx
) {
  const { seasonId } = await params

  const { error: authError } = await requireRole("STAFF")
  if (authError) return authError

  const { data, error: bodyError } = await parseBody(req, UpdateSeasonSchema)
  if (bodyError) return bodyError

  try {
    const existing = await prisma.season.findUnique({
      where:  { id: seasonId },
      select: { id: true, status: true, name: true },
    })
    if (!existing) return apiNotFound("Season")

    // Enforce single-ACTIVE constraint when changing status to ACTIVE
    if (data.status === "ACTIVE" && existing.status !== "ACTIVE") {
      const otherActive = await prisma.season.findFirst({
        where:  { status: "ACTIVE", id: { not: seasonId } },
        select: { id: true, name: true },
      })
      if (otherActive) {
        return apiConflict(
          `"${otherActive.name}" is already ACTIVE. Only one season may be active at a time.`
        )
      }
    }

    const season = await prisma.season.update({
      where:  { id: seasonId },
      data:   {
        ...(data.name              !== undefined && { name:              data.name }),
        ...(data.slug              !== undefined && { slug:              data.slug }),
        ...(data.description       !== undefined && { description:       data.description }),
        ...(data.status            !== undefined && { status:            data.status }),
        ...(data.isVisible         !== undefined && { isVisible:         data.isVisible }),
        ...(data.startDate         !== undefined && { startDate:         data.startDate }),
        ...(data.endDate           !== undefined && { endDate:           data.endDate }),
        ...(data.registrationStart !== undefined && { registrationStart: data.registrationStart }),
        ...(data.registrationEnd   !== undefined && { registrationEnd:   data.registrationEnd }),
        ...(data.leagueWeeks          !== undefined && { leagueWeeks:          data.leagueWeeks }),
        ...(data.checkInWindowMinutes !== undefined && { checkInWindowMinutes: data.checkInWindowMinutes }),
        ...(data.checkInGraceMinutes  !== undefined && { checkInGraceMinutes:  data.checkInGraceMinutes }),
        ...(data.resultWindowHours    !== undefined && { resultWindowHours:    data.resultWindowHours }),
        ...(data.pointsConfig         !== undefined && { pointsConfig:         data.pointsConfig as object }),
        ...(data.maxTeamsTotal        !== undefined && { maxTeamsTotal:        data.maxTeamsTotal }),
      },
      select: SEASON_SELECT,
    })

    return NextResponse.json(season)
  } catch (err) {
    return apiInternalError(err, "PATCH /api/seasons/:seasonId")
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/seasons/:seasonId
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: Ctx
) {
  const { seasonId } = await params

  const { error: authError } = await requireRole("ADMIN")
  if (authError) return authError

  try {
    const season = await prisma.season.findUnique({
      where:  { id: seasonId },
      select: {
        id:     true,
        status: true,
        _count: { select: { registrations: true } },
      },
    })
    if (!season) return apiNotFound("Season")

    // Only allow deleting DRAFT seasons with no registrations
    if (season.status !== "DRAFT") {
      return apiBadRequest("Only DRAFT seasons can be deleted. Set the season to DRAFT first.")
    }
    if (season._count.registrations > 0) {
      return apiBadRequest(
        `This season has ${season._count.registrations} registration(s) and cannot be deleted.`
      )
    }

    await prisma.season.delete({ where: { id: seasonId } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiInternalError(err, "DELETE /api/seasons/:seasonId")
  }
}
