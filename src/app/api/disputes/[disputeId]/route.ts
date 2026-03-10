/**
 * /api/disputes/:disputeId
 *
 * GET   — STAFF+ or manager of either team in the disputed match.
 * PATCH — STAFF+; resolve or dismiss the dispute, optionally setting corrected scores.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"
import { ResolveDisputeSchema } from "@/lib/validators/match.schema"
import { applyMatchToStandings, reverseMatchFromStandings } from "@/lib/services/standings.service"
import {
  apiBadRequest,
  apiForbidden,
  apiNotFound,
  parseBody,
  handleServiceError,
} from "@/lib/utils/errors"
import { z } from "zod"

type Params = { params: Promise<{ disputeId: string }> }

const DISPUTE_SELECT = {
  id:               true,
  status:           true,
  reason:           true,
  evidenceUrl:      true,
  resolution:       true,
  filedByTeamId:    true,
  createdAt:        true,
  resolvedAt:       true,
  originalHomeScore: true,
  originalAwayScore: true,
  resolvedHomeScore: true,
  resolvedAwayScore: true,
  match: {
    select: {
      id:        true,
      status:    true,
      homeScore: true,
      awayScore: true,
      homeTeam:  { select: { id: true, name: true, slug: true } },
      awayTeam:  { select: { id: true, name: true, slug: true } },
    },
  },
  filedBy:    { select: { id: true, name: true } },
  resolvedBy: { select: { id: true, name: true } },
} as const

// ---------------------------------------------------------------------------
// GET — dispute detail
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: Params) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { disputeId } = await params

  const dispute = await prisma.dispute.findUnique({
    where:  { id: disputeId },
    select: DISPUTE_SELECT,
  })
  if (!dispute) return apiNotFound("Dispute")

  // STAFF+ can see any dispute; managers can only see disputes for their matches
  if (!hasMinRole(session.user.role, "STAFF")) {
    const ownedTeam = await prisma.team.findFirst({
      where: {
        id: {
          in: [
            dispute.match.homeTeam.id,
            dispute.match.awayTeam.id,
          ],
        },
        ownerId: session.user.id,
      },
      select: { id: true },
    })
    if (!ownedTeam) return apiForbidden("You are not involved in this dispute")
  }

  return NextResponse.json(dispute)
}

// ---------------------------------------------------------------------------
// PATCH — resolve or dismiss (STAFF+)
// ---------------------------------------------------------------------------

const PatchDisputeSchema = ResolveDisputeSchema.extend({
  action: z.enum(["RESOLVED", "DISMISSED"]),
})

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireRole("STAFF")
  if (error) return error

  const { disputeId } = await params

  const dispute = await prisma.dispute.findUnique({
    where:  { id: disputeId },
    select: {
      id:      true,
      status:  true,
      matchId: true,
      match: {
        select: {
          status:     true,
          homeTeamId: true,
          awayTeamId: true,
        },
      },
    },
  })
  if (!dispute) return apiNotFound("Dispute")

  if (dispute.status === "RESOLVED" || dispute.status === "DISMISSED") {
    return apiBadRequest(`Dispute is already ${dispute.status}`)
  }

  const { data, error: bodyError } = await parseBody(req, PatchDisputeSchema)
  if (bodyError) return bodyError

  const now = new Date()

  try {
    await prisma.$transaction(async (tx) => {
      // Update the dispute record
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status:            data.action,
          resolution:        data.resolution,
          resolvedByUserId:  session.user.id,
          resolvedAt:        now,
          resolvedHomeScore: data.resolvedHomeScore ?? null,
          resolvedAwayScore: data.resolvedAwayScore ?? null,
        },
      })

      // If staff provided corrected scores, apply them to the match
      if (
        data.action === "RESOLVED" &&
        data.resolvedHomeScore !== undefined &&
        data.resolvedAwayScore !== undefined
      ) {
        const homeScore = data.resolvedHomeScore
        const awayScore = data.resolvedAwayScore
        const winnerId =
          homeScore > awayScore
            ? dispute.match.homeTeamId
            : dispute.match.awayTeamId

        // Reverse old standings contribution if match was already COMPLETED
        if (dispute.match.status === "COMPLETED") {
          await reverseMatchFromStandings(dispute.matchId)
        }

        await tx.match.update({
          where: { id: dispute.matchId },
          data: {
            status:           "COMPLETED",
            completedAt:      now,
            homeScore,
            awayScore,
            winnerId,
            enteredByStaffId: session.user.id,
          },
        })

        await tx.auditLog.create({
          data: {
            actorId:    session.user.id,
            action:     "DISPUTE_RESOLVED_WITH_SCORE_CORRECTION",
            entityType: "Dispute",
            entityId:   disputeId,
            after: {
              homeScore,
              awayScore,
              winnerId,
              resolution: data.resolution,
            },
          },
        })
      } else {
        // No score correction — just close the dispute and complete the match
        await tx.match.update({
          where: { id: dispute.matchId },
          data:  { status: "COMPLETED", completedAt: now },
        })

        await tx.auditLog.create({
          data: {
            actorId:    session.user.id,
            action:     `DISPUTE_${data.action}`,
            entityType: "Dispute",
            entityId:   disputeId,
            after:      { resolution: data.resolution },
          },
        })
      }
    })

    // Apply standings update outside the transaction (reads the now-updated match)
    if (data.action === "RESOLVED") {
      await applyMatchToStandings(dispute.matchId)
    }

    const updated = await prisma.dispute.findUnique({
      where:  { id: disputeId },
      select: DISPUTE_SELECT,
    })
    return NextResponse.json(updated)
  } catch (err) {
    return handleServiceError(err, "PATCH /disputes/:disputeId")
  }
}
