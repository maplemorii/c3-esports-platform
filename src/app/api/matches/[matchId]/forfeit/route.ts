/**
 * /api/matches/:matchId/forfeit
 *
 * POST — STAFF+; records a forfeit for the specified team.
 *        Sets the other team as winner, transitions to FORFEITED,
 *        and updates standings.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { transitionTo } from "@/lib/services/matchStatus.service"
import { applyMatchToStandings } from "@/lib/services/standings.service"
import { ForfeitMatchSchema } from "@/lib/validators/match.schema"
import {
  apiNotFound,
  apiBadRequest,
  parseBody,
  handleServiceError,
} from "@/lib/utils/errors"

type Params = { params: Promise<{ matchId: string }> }

export async function POST(req: Request, { params }: Params) {
  const { session, error } = await requireRole("STAFF")
  if (error) return error

  const { matchId } = await params

  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: { status: true, homeTeamId: true, awayTeamId: true },
  })
  if (!match) return apiNotFound("Match")

  const terminalStatuses = ["COMPLETED", "CANCELLED", "FORFEITED", "NO_SHOW"]
  if (terminalStatuses.includes(match.status)) {
    return apiBadRequest(`Match is already in a terminal state: ${match.status}`)
  }

  const { data, error: bodyError } = await parseBody(req, ForfeitMatchSchema)
  if (bodyError) return bodyError

  const { forfeitingTeamId, reason } = data

  if (
    forfeitingTeamId !== match.homeTeamId &&
    forfeitingTeamId !== match.awayTeamId
  ) {
    return apiBadRequest("forfeitingTeamId must be one of the teams in this match")
  }

  const winnerId =
    forfeitingTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId

  try {
    await prisma.$transaction([
      prisma.match.update({
        where: { id: matchId },
        data: {
          winnerId,
          status:      "FORFEITED",
          completedAt: new Date(),
          notes:       reason,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId:    session.user.id,
          action:     "MATCH_FORFEITED",
          entityType: "Match",
          entityId:   matchId,
          after:      { forfeitingTeamId, winnerId, reason },
        },
      }),
    ])

    await applyMatchToStandings(matchId)

    return NextResponse.json({ status: "FORFEITED", forfeitingTeamId, winnerId })
  } catch (err) {
    return handleServiceError(err, "POST /forfeit")
  }
}
