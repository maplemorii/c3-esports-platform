/**
 * /api/teams/:teamId/roster
 *
 * GET  — public; active roster for a team
 * POST — team owner or STAFF+; add a player to the roster
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { assertCanManageTeam } from "@/lib/auth/permissions"
import { AddRosterMemberSchema } from "@/lib/validators/team.schema"
import {
  parseBody,
  apiNotFound,
  apiConflict,
  apiBadRequest,
  apiInternalError,
} from "@/lib/utils/errors"
import { MAX_ROSTER_SIZE } from "@/lib/constants"

// ---------------------------------------------------------------------------
// Shared select
// ---------------------------------------------------------------------------

const MEMBERSHIP_SELECT = {
  id:          true,
  role:        true,
  isCaptain:   true,
  jerseyNumber: true,
  joinedAt:    true,
  player: {
    select: {
      id:              true,
      displayName:     true,
      avatarUrl:       true,
      epicUsername:    true,
      discordUsername: true,
    },
  },
} as const

// ---------------------------------------------------------------------------
// GET /api/teams/:teamId/roster
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  try {
    const team = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: { id: true },
    })
    if (!team) return apiNotFound("Team")

    const roster = await prisma.teamMembership.findMany({
      where:   { teamId, leftAt: null },
      select:  MEMBERSHIP_SELECT,
      orderBy: [{ isCaptain: "desc" }, { role: "asc" }, { joinedAt: "asc" }],
    })

    return NextResponse.json({ data: roster, total: roster.length })
  } catch (err) {
    return apiInternalError(err, "GET /api/teams/:teamId/roster")
  }
}

// ---------------------------------------------------------------------------
// POST /api/teams/:teamId/roster
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  // Auth
  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  // Permission: owner or STAFF+
  const denied = await assertCanManageTeam(session, teamId)
  if (denied) return denied

  // Validate body
  const { data, error: bodyError } = await parseBody(req, AddRosterMemberSchema)
  if (bodyError) return bodyError

  try {
    // Team must exist
    const team = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: { id: true },
    })
    if (!team) return apiNotFound("Team")

    // Player must exist
    const player = await prisma.player.findUnique({
      where:  { id: data.playerId },
      select: { id: true },
    })
    if (!player) return apiNotFound("Player")

    // Player must not already be active on this team
    const existing = await prisma.teamMembership.findFirst({
      where: { teamId, playerId: data.playerId, leftAt: null },
      select: { id: true },
    })
    if (existing) return apiConflict("This player is already on the roster")

    // Enforce max roster size
    const activeCount = await prisma.teamMembership.count({
      where: { teamId, leftAt: null },
    })
    if (activeCount >= MAX_ROSTER_SIZE) {
      return apiBadRequest(
        `Roster is full — maximum ${MAX_ROSTER_SIZE} active members allowed`
      )
    }

    const membership = await prisma.teamMembership.create({
      data: {
        teamId,
        playerId:    data.playerId,
        role:        data.role,
        isCaptain:   data.isCaptain,
        jerseyNumber: data.jerseyNumber,
      },
      select: MEMBERSHIP_SELECT,
    })

    return NextResponse.json(membership, { status: 201 })
  } catch (err) {
    return apiInternalError(err, "POST /api/teams/:teamId/roster")
  }
}
