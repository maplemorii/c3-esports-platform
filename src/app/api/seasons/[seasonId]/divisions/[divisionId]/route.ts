/**
 * /api/seasons/:seasonId/divisions/:divisionId
 *
 * PATCH  — STAFF+; update division settings
 * DELETE — STAFF+; delete a division (blocked if it has registrations)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { UpdateDivisionSchema } from "@/lib/validators/season.schema"
import {
  parseBody,
  apiNotFound,
  apiBadRequest,
  apiInternalError,
} from "@/lib/utils/errors"

type Ctx = { params: Promise<{ seasonId: string; divisionId: string }> }

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
// PATCH /api/seasons/:seasonId/divisions/:divisionId
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: Ctx
) {
  const { divisionId } = await params

  const { error: authError } = await requireRole("STAFF")
  if (authError) return authError

  const { data, error: bodyError } = await parseBody(req, UpdateDivisionSchema)
  if (bodyError) return bodyError

  try {
    const existing = await prisma.division.findUnique({
      where:  { id: divisionId },
      select: { id: true },
    })
    if (!existing) return apiNotFound("Division")

    const division = await prisma.division.update({
      where: { id: divisionId },
      data: {
        ...(data.name        !== undefined && { name:        data.name }),
        ...(data.tier        !== undefined && { tier:        data.tier }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.maxTeams    !== undefined && { maxTeams:    data.maxTeams }),
        ...(data.bracketType !== undefined && { bracketType: data.bracketType }),
      },
      select: DIVISION_SELECT,
    })

    return NextResponse.json(division)
  } catch (err) {
    return apiInternalError(err, "PATCH /api/seasons/:seasonId/divisions/:divisionId")
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/seasons/:seasonId/divisions/:divisionId
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: Ctx
) {
  const { divisionId } = await params

  const { error: authError } = await requireRole("STAFF")
  if (authError) return authError

  try {
    const division = await prisma.division.findUnique({
      where:  { id: divisionId },
      select: { id: true, _count: { select: { registrations: true } } },
    })
    if (!division) return apiNotFound("Division")

    if (division._count.registrations > 0) {
      return apiBadRequest(
        `This division has ${division._count.registrations} registration(s) and cannot be deleted.`
      )
    }

    await prisma.division.delete({ where: { id: divisionId } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiInternalError(err, "DELETE /api/seasons/:seasonId/divisions/:divisionId")
  }
}