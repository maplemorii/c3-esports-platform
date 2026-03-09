/**
 * /api/matches/:matchId/replays/:gameNumber
 *
 * GET    — public; full replay detail + parse status for one game slot
 * DELETE — authenticated roster member or STAFF+; removes the replay,
 *          resetting that slot to manual score entry
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"
import { deleteReplayUpload } from "@/lib/services/replay.service"
import {
  apiNotFound,
  apiForbidden,
  handleServiceError,
} from "@/lib/utils/errors"

type Params = { params: Promise<{ matchId: string; gameNumber: string }> }

// ---------------------------------------------------------------------------
// GET — replay detail (public)
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: Params) {
  const { matchId, gameNumber: gameNumberStr } = await params
  const gameNumber = parseInt(gameNumberStr, 10)

  if (isNaN(gameNumber) || gameNumber < 1) {
    return NextResponse.json({ error: "gameNumber must be a positive integer" }, { status: 400 })
  }

  const upload = await prisma.replayUpload.findUnique({
    where: { matchId_gameNumber: { matchId, gameNumber } },
    select: {
      id:               true,
      matchId:          true,
      gameNumber:       true,
      fileKey:          true,
      parseStatus:      true,
      parseError:       true,
      parseStartedAt:   true,
      parseCompletedAt: true,
      ballchasingId:    true,
      ballchasingUrl:   true,
      parsedHomeGoals:  true,
      parsedAwayGoals:  true,
      parsedDuration:   true,
      parsedOvertime:   true,
      scoresAccepted:   true,
      homeTeamColor:    true,
      uploadedByTeamId: true,
      createdAt:        true,
      updatedAt:        true,
      gameResult: {
        select: {
          homeGoals: true,
          awayGoals: true,
          overtime:  true,
          duration:  true,
          source:    true,
        },
      },
      playerStats: {
        select: {
          id:               true,
          epicUsername:     true,
          teamSide:         true,
          score:            true,
          goals:            true,
          assists:          true,
          saves:            true,
          shots:            true,
          demos:            true,
          boostUsed:        true,
          avgBoostAmount:   true,
          timeSupersonic:   true,
          distanceTraveled: true,
          timeInAir:        true,
          boostCollected:   true,
          playerId:         true,
        },
      },
    },
  })

  if (!upload) return apiNotFound(`Replay for game ${gameNumber}`)

  return NextResponse.json(upload)
}

// ---------------------------------------------------------------------------
// DELETE — remove replay (authenticated)
// ---------------------------------------------------------------------------

export async function DELETE(_req: Request, { params }: Params) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { matchId, gameNumber: gameNumberStr } = await params
  const gameNumber = parseInt(gameNumberStr, 10)

  if (isNaN(gameNumber) || gameNumber < 1) {
    return NextResponse.json({ error: "gameNumber must be a positive integer" }, { status: 400 })
  }

  // Permission: roster member of either team, or STAFF+
  if (!hasMinRole(session.user.role, "STAFF")) {
    const match = await prisma.match.findUnique({
      where:  { id: matchId, deletedAt: null },
      select: { homeTeamId: true, awayTeamId: true },
    })
    if (!match) return apiNotFound("Match")

    const player = await prisma.player.findUnique({
      where:  { userId: session.user.id },
      select: { id: true },
    })
    if (!player) return apiForbidden("You are not an active roster member of either team")

    const membership = await prisma.teamMembership.findFirst({
      where: {
        playerId: player.id,
        leftAt:   null,
        teamId:   { in: [match.homeTeamId, match.awayTeamId] },
      },
      select: { id: true },
    })
    if (!membership) return apiForbidden("You are not an active roster member of either team")
  }

  try {
    await deleteReplayUpload(matchId, gameNumber)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleServiceError(err, "DELETE /replays/:gameNumber")
  }
}
