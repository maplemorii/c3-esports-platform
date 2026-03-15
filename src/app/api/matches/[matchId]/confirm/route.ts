/**
 * /api/matches/:matchId/confirm
 *
 * POST — the opposing team (not the submitter) confirms the submitted scores.
 *        VERIFYING → COMPLETED; updates standings.
 *
 * If the opposing team disagrees with the scores they should file a dispute
 * via POST /api/disputes instead.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { transitionTo } from "@/lib/services/matchStatus.service"
import { applyMatchToStandings } from "@/lib/services/standings.service"
import { sendBotWebhook } from "@/lib/bot-webhook"
import {
  apiNotFound,
  apiForbidden,
  apiBadRequest,
  handleServiceError,
} from "@/lib/utils/errors"

type Params = { params: Promise<{ matchId: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { matchId } = await params

  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: {
      status:            true,
      homeTeamId:        true,
      awayTeamId:        true,
      submittedByTeamId: true,
      homeScore:         true,
      awayScore:         true,
      winnerId:          true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  })
  if (!match) return apiNotFound("Match")

  if (match.status !== "VERIFYING") {
    return apiBadRequest(
      `Confirmation is only available when the match is VERIFYING (current: ${match.status})`
    )
  }

  if (!match.submittedByTeamId) {
    return apiBadRequest("No score submission found to confirm")
  }

  // The confirming user must manage the team that did NOT submit
  const confirmingTeamId =
    match.submittedByTeamId === match.homeTeamId
      ? match.awayTeamId
      : match.homeTeamId

  const ownedTeam = await prisma.team.findFirst({
    where: { id: confirmingTeamId, ownerId: session.user.id },
    select: { id: true },
  })
  if (!ownedTeam) {
    return apiForbidden(
      "Only the manager of the opposing team can confirm these scores"
    )
  }

  try {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        confirmedByTeamId: confirmingTeamId,
        confirmedAt:       new Date(),
      },
    })

    await transitionTo(matchId, "COMPLETED", session.user.id, "Opponent confirmed scores")
    await applyMatchToStandings(matchId)

    sendBotWebhook("match.completed", {
      matchId,
      homeTeamId: match.homeTeamId,
      homeTeam:   match.homeTeam?.name,
      awayTeamId: match.awayTeamId,
      awayTeam:   match.awayTeam?.name,
      homeScore:  match.homeScore,
      awayScore:  match.awayScore,
      winnerId:   match.winnerId,
    })

    return NextResponse.json({
      status:    "COMPLETED",
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      winnerId:  match.winnerId,
    })
  } catch (err) {
    return handleServiceError(err, "POST /confirm")
  }
}
