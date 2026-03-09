/**
 * /api/matches/:matchId
 *
 * GET    — full match detail (public)
 * PATCH  — reschedule match (STAFF+)
 * DELETE — cancel match (STAFF+)
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { RescheduleMatchSchema } from "@/lib/validators/match.schema"
import { rescheduleMatch, cancelMatch } from "@/lib/services/match.service"

type Params = { params: Promise<{ matchId: string }> }

// ---------------------------------------------------------------------------
// GET — full match detail
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: Params) {
  const { matchId } = await params

  const match = await prisma.match.findUnique({
    where: { id: matchId, deletedAt: null },
    select: {
      id:                 true,
      status:             true,
      format:             true,
      matchType:          true,
      scheduledAt:        true,
      checkInOpenAt:      true,
      checkInDeadlineAt:  true,
      resultDeadlineAt:   true,
      completedAt:        true,
      homeScore:          true,
      awayScore:          true,
      gamesExpected:      true,
      replaysVerified:    true,
      isBracketMatch:     true,
      notes:              true,
      submittedAt:        true,
      confirmedAt:        true,
      createdAt:          true,
      updatedAt:          true,

      homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
      winner:   { select: { id: true, name: true, slug: true } },
      division: {
        select: {
          id:   true,
          name: true,
          tier: true,
          season: { select: { id: true, name: true, slug: true } },
        },
      },
      leagueWeek: {
        select: { id: true, weekNumber: true, startDate: true, endDate: true },
      },

      checkIns: {
        select: {
          id:          true,
          teamId:      true,
          status:      true,
          checkedInAt: true,
          team: { select: { id: true, name: true, slug: true } },
        },
      },

      games: {
        orderBy: { gameNumber: "asc" },
        select: {
          id:           true,
          gameNumber:   true,
          homeGoals:    true,
          awayGoals:    true,
          overtime:     true,
          resultSource: true,
          createdAt:    true,
        },
      },

      replays: {
        orderBy: { gameNumber: "asc" },
        select: {
          id:               true,
          gameNumber:       true,
          fileKey:          true,
          parseStatus:      true,
          parseError:       true,
          parseCompletedAt: true,
          createdAt:        true,
          uploadedByTeamId: true,
          ballchasingUrl:   true,
        },
      },

      dispute: {
        select: {
          id:         true,
          status:     true,
          reason:     true,
          evidenceUrl: true,
          resolution: true,
          createdAt:  true,
          resolvedAt: true,
        },
      },
    },
  })

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  return NextResponse.json(match)
}

// ---------------------------------------------------------------------------
// PATCH — reschedule
// ---------------------------------------------------------------------------

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireRole("STAFF")
  if (error) return error

  const { matchId } = await params

  const body = await req.json().catch(() => null)
  const parsed = RescheduleMatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const match = await rescheduleMatch(
      matchId,
      { scheduledAt: parsed.data.scheduledAt },
      session.user.id
    )
    return NextResponse.json(match)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reschedule match"
    const status = message.includes("not found") ? 404 : 422
    return NextResponse.json({ error: message }, { status })
  }
}

// ---------------------------------------------------------------------------
// DELETE — cancel
// ---------------------------------------------------------------------------

export async function DELETE(req: Request, { params }: Params) {
  const { session, error } = await requireRole("STAFF")
  if (error) return error

  const { matchId } = await params

  // Optional reason in request body
  let reason = "Cancelled by staff"
  try {
    const body = await req.json()
    if (typeof body?.reason === "string" && body.reason.trim()) {
      reason = body.reason.trim()
    }
  } catch {
    // body is optional
  }

  try {
    const match = await cancelMatch(matchId, reason, session.user.id)
    return NextResponse.json(match)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel match"
    const status = message.includes("not found") ? 404 : 422
    return NextResponse.json({ error: message }, { status })
  }
}
