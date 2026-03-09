/**
 * /api/matches/:matchId/checkin
 *
 * GET  — public; returns check-in status for both teams
 * POST — authenticated team owner; checks their team in
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { getCheckInStatus, checkIn } from "@/lib/services/checkin.service"
import {
  apiNotFound,
  apiForbidden,
  handleServiceError,
} from "@/lib/utils/errors"

type Params = { params: Promise<{ matchId: string }> }

// ---------------------------------------------------------------------------
// GET — check-in status (public)
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: Params) {
  const { matchId } = await params

  try {
    const status = await getCheckInStatus(matchId)
    return NextResponse.json(status)
  } catch (err) {
    return handleServiceError(err, "GET /checkin")
  }
}

// ---------------------------------------------------------------------------
// POST — team checks in
// ---------------------------------------------------------------------------

export async function POST(_req: Request, { params }: Params) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { matchId } = await params

  // Determine which match team this user owns
  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: { homeTeamId: true, awayTeamId: true },
  })
  if (!match) return apiNotFound("Match")

  const teamOwnership = await prisma.team.findFirst({
    where:  { id: { in: [match.homeTeamId, match.awayTeamId] }, ownerId: session.user.id },
    select: { id: true },
  })
  if (!teamOwnership) return apiForbidden("You are not an owner of either team in this match")

  try {
    const record = await checkIn(matchId, teamOwnership.id, session.user.id)
    return NextResponse.json(record)
  } catch (err) {
    return handleServiceError(err, "POST /checkin")
  }
}
