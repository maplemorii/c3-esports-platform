/**
 * /api/matches/:matchId/result
 *
 * POST  — manual score submission (team manager); creates MatchGame rows for
 *         game slots that do not already have a valid (SUCCESS) replay.
 *         Transitions the match to VERIFYING.
 *
 * PATCH — staff result override at any stage; force-sets all game slots to
 *         STAFF_OVERRIDE source, transitions to COMPLETED, updates standings.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/session"
import { transitionTo } from "@/lib/services/matchStatus.service"
import {
  applyMatchToStandings,
  reverseMatchFromStandings,
} from "@/lib/services/standings.service"
import {
  SubmitResultSchema,
  StaffResultOverrideSchema,
} from "@/lib/validators/match.schema"
import {
  apiNotFound,
  apiForbidden,
  apiBadRequest,
  parseBody,
  handleServiceError,
} from "@/lib/utils/errors"
import { sendResultSubmittedEmail } from "@/lib/email"
import { logger } from "@/lib/logger"

type Params = { params: Promise<{ matchId: string }> }

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Derives series score and winner from individual game results. */
function computeSeries(
  games: { homeGoals: number; awayGoals: number }[],
  homeTeamId: string,
  awayTeamId: string
) {
  let homeScore = 0
  let awayScore = 0
  for (const g of games) {
    if (g.homeGoals > g.awayGoals) homeScore++
    else awayScore++
  }
  const winnerId = homeScore > awayScore ? homeTeamId : awayTeamId
  return { homeScore, awayScore, winnerId }
}

// ---------------------------------------------------------------------------
// POST — team manager submits manual scores
// ---------------------------------------------------------------------------

export async function POST(req: Request, { params }: Params) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { matchId } = await params

  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: {
      status:            true,
      format:            true,
      homeTeamId:        true,
      awayTeamId:        true,
      submittedByTeamId: true,
      homeTeam: { select: { name: true, owner: { select: { id: true, name: true, email: true, emailNotifResults: true } } } },
      awayTeam: { select: { name: true, owner: { select: { id: true, name: true, email: true, emailNotifResults: true } } } },
    },
  })
  if (!match) return apiNotFound("Match")

  const acceptableStatuses = ["IN_PROGRESS", "MATCH_FINISHED"]
  if (!acceptableStatuses.includes(match.status)) {
    return apiBadRequest(
      `Results can only be submitted when the match is IN_PROGRESS or MATCH_FINISHED (current: ${match.status})`
    )
  }

  // Determine which team this user manages
  const ownedTeam = await prisma.team.findFirst({
    where: {
      id:      { in: [match.homeTeamId, match.awayTeamId] },
      ownerId: session.user.id,
    },
    select: { id: true },
  })
  if (!ownedTeam) {
    return apiForbidden("You are not the manager of either team in this match")
  }

  // One submission per match — the other team must use /confirm
  if (match.submittedByTeamId) {
    return apiBadRequest(
      "Scores have already been submitted. The opposing team must confirm via /confirm."
    )
  }

  const { data, error: bodyError } = await parseBody(req, SubmitResultSchema)
  if (bodyError) return bodyError

  // Fetch game slots already covered by a SUCCESS replay (exclude from manual entry)
  const successReplays = await prisma.replayUpload.findMany({
    where:  { matchId, parseStatus: "SUCCESS" },
    select: { gameNumber: true },
  })
  const replayedGameNumbers = new Set(successReplays.map((r) => r.gameNumber))

  const manualGames = data.games.filter((g) => !replayedGameNumbers.has(g.gameNumber))
  if (manualGames.length === 0) {
    return apiBadRequest(
      "All game slots already have verified replays. Manual entry is not needed."
    )
  }

  try {
    // Upsert MatchGame rows for manual slots
    await Promise.all(
      manualGames.map((g) =>
        prisma.matchGame.upsert({
          where:  { matchId_gameNumber: { matchId, gameNumber: g.gameNumber } },
          create: {
            matchId,
            gameNumber: g.gameNumber,
            homeGoals:  g.homeGoals,
            awayGoals:  g.awayGoals,
            overtime:   g.overtime ?? false,
            source:     "MANUAL",
          },
          update: {
            homeGoals: g.homeGoals,
            awayGoals: g.awayGoals,
            overtime:  g.overtime ?? false,
            source:    "MANUAL",
          },
        })
      )
    )

    // Compute series totals across ALL current game slots (replays + manual)
    const allGames = await prisma.matchGame.findMany({
      where:  { matchId },
      select: { homeGoals: true, awayGoals: true },
    })
    const { homeScore, awayScore, winnerId } = computeSeries(
      allGames,
      match.homeTeamId,
      match.awayTeamId
    )

    // Create a MatchReport for audit purposes
    await prisma.matchReport.create({
      data: {
        matchId,
        submittedById:    session.user.id,
        submittingTeamId: ownedTeam.id,
        reportedHomeScore: homeScore,
        reportedAwayScore: awayScore,
        gameBreakdown: data.games,
      },
    })

    // Update match: record submission + series scores
    await prisma.match.update({
      where: { id: matchId },
      data: {
        submittedByTeamId: ownedTeam.id,
        submittedAt:       new Date(),
        homeScore,
        awayScore,
        winnerId,
      },
    })

    // Advance status: IN_PROGRESS → MATCH_FINISHED → VERIFYING
    if (match.status === "IN_PROGRESS") {
      await transitionTo(matchId, "MATCH_FINISHED", session.user.id)
    }
    await transitionTo(matchId, "VERIFYING", session.user.id)

    // Notify the opposing team manager (fire-and-forget)
    const opposingOwner = ownedTeam.id === match.homeTeamId
      ? match.awayTeam?.owner
      : match.homeTeam?.owner
    if (opposingOwner?.email && opposingOwner.emailNotifResults) {
      sendResultSubmittedEmail({
        to:            opposingOwner.email,
        recipientName: opposingOwner.name ?? "Manager",
        matchId,
        homeTeam:  match.homeTeam?.name ?? "Home",
        awayTeam:  match.awayTeam?.name ?? "Away",
        homeScore,
        awayScore,
      }).catch((err) => logger.error({ err, matchId }, "Failed to send result email"))
    }

    return NextResponse.json({ homeScore, awayScore, winnerId }, { status: 201 })
  } catch (err) {
    return handleServiceError(err, "POST /result")
  }
}

// ---------------------------------------------------------------------------
// PATCH — staff result override
// ---------------------------------------------------------------------------

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireRole("STAFF")
  if (error) return error

  const { matchId } = await params

  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: { status: true, homeTeamId: true, awayTeamId: true },
  })
  if (!match) return apiNotFound("Match")

  const { data, error: bodyError } = await parseBody(req, StaffResultOverrideSchema)
  if (bodyError) return bodyError

  try {
    // If already completed, reverse prior standings contribution first
    if (match.status === "COMPLETED") {
      await reverseMatchFromStandings(matchId)
    }

    // Upsert all game slots as STAFF_OVERRIDE
    await Promise.all(
      data.games.map((g) =>
        prisma.matchGame.upsert({
          where:  { matchId_gameNumber: { matchId, gameNumber: g.gameNumber } },
          create: {
            matchId,
            gameNumber: g.gameNumber,
            homeGoals:  g.homeGoals,
            awayGoals:  g.awayGoals,
            overtime:   g.overtime ?? false,
            source:     "STAFF_OVERRIDE",
          },
          update: {
            homeGoals: g.homeGoals,
            awayGoals: g.awayGoals,
            overtime:  g.overtime ?? false,
            source:    "STAFF_OVERRIDE",
          },
        })
      )
    )

    const { homeScore, awayScore, winnerId } = computeSeries(
      data.games,
      match.homeTeamId,
      match.awayTeamId
    )

    await prisma.$transaction([
      prisma.match.update({
        where: { id: matchId },
        data: {
          status:           "COMPLETED",
          completedAt:      new Date(),
          homeScore,
          awayScore,
          winnerId,
          enteredByStaffId: session.user.id,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId:    session.user.id,
          action:     "STAFF_RESULT_OVERRIDE",
          entityType: "Match",
          entityId:   matchId,
          after: {
            homeScore,
            awayScore,
            winnerId,
            reason: data.reason,
            games:  data.games,
          },
        },
      }),
    ])

    await applyMatchToStandings(matchId)

    return NextResponse.json({ homeScore, awayScore, winnerId })
  } catch (err) {
    return handleServiceError(err, "PATCH /result")
  }
}
