/**
 * POST /api/seasons/:seasonId/weeks/generate
 *
 * STAFF+. Auto-generates LeagueWeek rows from season.startDate and
 * season.leagueWeeks. Idempotent — safe to call multiple times.
 *
 * Requires the season to have a startDate set.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { apiNotFound, apiBadRequest, apiInternalError } from "@/lib/utils/errors"
import { generateWeeks } from "@/lib/services/leagueWeek.service"

type Ctx = { params: Promise<{ seasonId: string }> }

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { seasonId } = await params

  const { error: authError } = await requireRole("STAFF")
  if (authError) return authError

  try {
    const season = await prisma.season.findUnique({
      where:  { id: seasonId },
      select: { id: true, startDate: true, leagueWeeks: true, name: true },
    })
    if (!season) return apiNotFound("Season")

    if (!season.startDate) {
      return apiBadRequest(
        "Season has no startDate. Set the season start date before generating weeks."
      )
    }

    if (season.leagueWeeks < 1) {
      return apiBadRequest("Season leagueWeeks must be at least 1.")
    }

    const weeks = await generateWeeks(seasonId)
    return NextResponse.json(weeks, { status: 201 })
  } catch (err) {
    return apiInternalError(err, "POST /api/seasons/:seasonId/weeks/generate")
  }
}
