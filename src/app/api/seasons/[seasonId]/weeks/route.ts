/**
 * GET /api/seasons/:seasonId/weeks
 *
 * Public. Returns all league weeks for a season ordered by week number,
 * each with match count and completion state.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiNotFound, apiInternalError } from "@/lib/utils/errors"
import { getWeeksForSeason } from "@/lib/services/leagueWeek.service"

type Ctx = { params: Promise<{ seasonId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { seasonId } = await params
  try {
    const season = await prisma.season.findUnique({
      where:  { id: seasonId },
      select: { id: true },
    })
    if (!season) return apiNotFound("Season")

    const weeks = await getWeeksForSeason(seasonId)
    return NextResponse.json(weeks)
  } catch (err) {
    return apiInternalError(err, "GET /api/seasons/:seasonId/weeks")
  }
}
