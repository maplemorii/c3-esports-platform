/**
 * /api/seasons/:seasonId/weeks/:weekId
 *
 * GET   — public; week detail + matches.
 *          :weekId may be the DB id OR the 1-based week number.
 *
 * PATCH — STAFF+; adjust the week's date range.
 *          Body: { startDate: ISO string, endDate: ISO string }
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import {
  apiNotFound,
  apiBadRequest,
  parseBody,
  apiInternalError,
} from "@/lib/utils/errors"
import { getWeekWithMatches, adjustWeekDates } from "@/lib/services/leagueWeek.service"

type Ctx = { params: Promise<{ seasonId: string; weekId: string }> }

// ---------------------------------------------------------------------------
// Shared lookup — accepts DB id or 1-based week number
// ---------------------------------------------------------------------------

async function findWeek(seasonId: string, weekId: string) {
  const asNumber = Number(weekId)
  if (!Number.isNaN(asNumber) && Number.isInteger(asNumber) && asNumber > 0) {
    return getWeekWithMatches(seasonId, asNumber)
  }
  // Fall back to DB id lookup
  return prisma.leagueWeek.findFirst({
    where: { id: weekId, seasonId },
    include: {
      matches: {
        where:   { deletedAt: null },
        include: {
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// GET /api/seasons/:seasonId/weeks/:weekId
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { seasonId, weekId } = await params
  try {
    const season = await prisma.season.findUnique({
      where:  { id: seasonId },
      select: { id: true },
    })
    if (!season) return apiNotFound("Season")

    const week = await findWeek(seasonId, weekId)
    if (!week) return apiNotFound("Week")

    return NextResponse.json(week)
  } catch (err) {
    return apiInternalError(err, "GET /api/seasons/:seasonId/weeks/:weekId")
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/seasons/:seasonId/weeks/:weekId
// ---------------------------------------------------------------------------

const AdjustWeekSchema = z.object({
  startDate: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
  endDate:   z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
}).refine((d) => d.startDate < d.endDate, {
  message: "startDate must be before endDate",
  path:    ["endDate"],
})

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { seasonId, weekId } = await params

  const { session, error: authError } = await requireRole("STAFF")
  if (authError) return authError

  const { data, error: bodyError } = await parseBody(req, AdjustWeekSchema)
  if (bodyError) return bodyError

  try {
    // Resolve to DB id — the service requires a stable id, not week number
    const existing = await prisma.leagueWeek.findFirst({
      where:  { OR: [{ id: weekId }, { weekNumber: Number(weekId) || -1 }], seasonId },
      select: { id: true },
    })
    if (!existing) return apiNotFound("Week")

    if (data.startDate >= data.endDate) {
      return apiBadRequest("startDate must be before endDate")
    }

    const updated = await adjustWeekDates(
      existing.id,
      data.startDate,
      data.endDate,
      session.user.id
    )

    return NextResponse.json(updated)
  } catch (err) {
    return apiInternalError(err, "PATCH /api/seasons/:seasonId/weeks/:weekId")
  }
}
