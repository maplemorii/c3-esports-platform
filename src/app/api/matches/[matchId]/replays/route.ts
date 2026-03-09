/**
 * /api/matches/:matchId/replays
 *
 * GET  — public; returns upload slots + parse status for all games
 * POST — authenticated roster member (or STAFF+); records a replay upload
 *        after the file has already been placed in S3/R2 via presigned URL
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"
import { createReplayUpload } from "@/lib/services/replay.service"
import { CreateReplayUploadSchema } from "@/lib/validators/match.schema"
import {
  apiNotFound,
  apiForbidden,
  parseBody,
  handleServiceError,
} from "@/lib/utils/errors"

type Params = { params: Promise<{ matchId: string }> }

// ---------------------------------------------------------------------------
// GET — replay slots + parse status (public)
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: Params) {
  const { matchId } = await params

  const match = await prisma.match.findUnique({
    where: { id: matchId, deletedAt: null },
    select: {
      gamesExpected: true,
      replaysVerified: true,
      replays: {
        orderBy: { gameNumber: "asc" },
        select: {
          id:               true,
          gameNumber:       true,
          fileKey:          true,
          parseStatus:      true,
          parseError:       true,
          parseStartedAt:   true,
          parseCompletedAt: true,
          ballchasingUrl:   true,
          uploadedByTeamId: true,
          parsedHomeGoals:  true,
          parsedAwayGoals:  true,
          parsedOvertime:   true,
          scoresAccepted:   true,
          createdAt:        true,
          updatedAt:        true,
          gameResult: {
            select: {
              homeGoals:  true,
              awayGoals:  true,
              overtime:   true,
              source:     true,
            },
          },
        },
      },
    },
  })

  if (!match) return apiNotFound("Match")

  return NextResponse.json({
    gamesExpected:   match.gamesExpected,
    replaysVerified: match.replaysVerified,
    replays:         match.replays,
  })
}

// ---------------------------------------------------------------------------
// POST — register a replay upload (file already in S3/R2)
// ---------------------------------------------------------------------------

export async function POST(req: Request, { params }: Params) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { matchId } = await params

  const match = await prisma.match.findUnique({
    where: { id: matchId, deletedAt: null },
    select: { homeTeamId: true, awayTeamId: true },
  })
  if (!match) return apiNotFound("Match")

  // Determine which team the uploader belongs to
  let uploadedByTeamId: string

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (player) {
    const membership = await prisma.teamMembership.findFirst({
      where: {
        playerId: player.id,
        leftAt:   null,
        teamId:   { in: [match.homeTeamId, match.awayTeamId] },
      },
      select: { teamId: true },
    })

    if (membership) {
      uploadedByTeamId = membership.teamId
    } else if (hasMinRole(session.user.role, "STAFF")) {
      // Staff not on a roster — attribute to home team for audit purposes
      uploadedByTeamId = match.homeTeamId
    } else {
      return apiForbidden("You are not an active roster member of either team in this match")
    }
  } else if (hasMinRole(session.user.role, "STAFF")) {
    uploadedByTeamId = match.homeTeamId
  } else {
    return apiForbidden("You are not an active roster member of either team in this match")
  }

  const { data, error: bodyError } = await parseBody(req, CreateReplayUploadSchema)
  if (bodyError) return bodyError

  try {
    const upload = await createReplayUpload({
      matchId,
      gameNumber:       data.gameNumber,
      fileKey:          data.fileKey,
      homeTeamColor:    data.homeTeamColor,
      uploadedById:     session.user.id,
      uploadedByTeamId,
    })

    return NextResponse.json(upload, { status: 201 })
  } catch (err) {
    return handleServiceError(err, "POST /replays")
  }
}
