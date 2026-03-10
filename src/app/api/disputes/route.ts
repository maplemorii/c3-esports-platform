/**
 * /api/disputes
 *
 * GET  — STAFF+; paginated list of all disputes, filterable by status.
 * POST — authenticated team manager; files a dispute for a match they're involved in.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"
import { CreateDisputeSchema } from "@/lib/validators/match.schema"
import {
  apiBadRequest,
  apiForbidden,
  apiNotFound,
  parseBody,
  handleServiceError,
} from "@/lib/utils/errors"

// ---------------------------------------------------------------------------
// GET — list disputes (STAFF+)
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const { error } = await requireRole("STAFF")
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get("status") ?? undefined   // OPEN | UNDER_REVIEW | RESOLVED | DISMISSED
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)))

  const where = status ? { status: status as never } : {}

  const [total, disputes] = await Promise.all([
    prisma.dispute.count({ where }),
    prisma.dispute.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      select: {
        id:             true,
        status:         true,
        reason:         true,
        evidenceUrl:    true,
        resolution:     true,
        createdAt:      true,
        resolvedAt:     true,
        filedByTeamId:  true,
        originalHomeScore: true,
        originalAwayScore: true,
        resolvedHomeScore: true,
        resolvedAwayScore: true,
        match: {
          select: {
            id:       true,
            status:   true,
            homeTeam: { select: { id: true, name: true, slug: true } },
            awayTeam: { select: { id: true, name: true, slug: true } },
          },
        },
        filedBy:    { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    }),
  ])

  return NextResponse.json({
    data: disputes,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  })
}

// ---------------------------------------------------------------------------
// POST — file a dispute (team manager)
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { data, error: bodyError } = await parseBody(req, CreateDisputeSchema)
  if (bodyError) return bodyError

  const match = await prisma.match.findUnique({
    where:  { id: data.matchId, deletedAt: null },
    select: {
      id:        true,
      status:    true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore:  true,
      awayScore:  true,
    },
  })
  if (!match) return apiNotFound("Match")

  // Disputes can only be filed while the match is active / unresolved
  const nonDisputeableStatuses = ["COMPLETED", "CANCELLED", "NO_SHOW"]
  if (nonDisputeableStatuses.includes(match.status) && !hasMinRole(session.user.role, "STAFF")) {
    return apiBadRequest(`Cannot file a dispute for a match in ${match.status} status`)
  }

  // Filer must be owner of one of the two teams (or STAFF+)
  let filedByTeamId: string

  if (hasMinRole(session.user.role, "STAFF")) {
    // Staff can file on behalf of either team — use homeTeam as default
    filedByTeamId = match.homeTeamId
  } else {
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
    filedByTeamId = ownedTeam.id
  }

  // One dispute per match (Dispute.matchId is @unique)
  const existing = await prisma.dispute.findUnique({
    where:  { matchId: data.matchId },
    select: { id: true },
  })
  if (existing) {
    return apiBadRequest("A dispute already exists for this match")
  }

  try {
    const dispute = await prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          matchId:           data.matchId,
          filedByUserId:     session.user.id,
          filedByTeamId,
          reason:            data.reason,
          evidenceUrl:       data.evidenceUrl ?? null,
          status:            "OPEN",
          originalHomeScore: match.homeScore ?? null,
          originalAwayScore: match.awayScore ?? null,
        },
      })

      // Transition match to DISPUTED if it isn't already
      if (match.status !== "DISPUTED") {
        await tx.match.update({
          where: { id: data.matchId },
          data:  { status: "DISPUTED" },
        })
      }

      return created
    })

    return NextResponse.json(dispute, { status: 201 })
  } catch (err) {
    return handleServiceError(err, "POST /disputes")
  }
}
