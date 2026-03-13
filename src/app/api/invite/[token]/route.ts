/**
 * /api/invite/:token
 *
 * POST — authenticated user uses an invite token to join a team.
 *        Requester must have a player profile.
 *        Returns 410 if token is expired or not found.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import {
  apiNotFound,
  apiConflict,
  apiBadRequest,
  apiInternalError,
} from "@/lib/utils/errors"
import { MAX_ROSTER_SIZE } from "@/lib/constants"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  try {
    // Look up team by token
    const team = await prisma.team.findUnique({
      where:  { inviteToken: token, deletedAt: null },
      select: { id: true, inviteExpiresAt: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: "Invite link is invalid or has been revoked" },
        { status: 410 }
      )
    }

    if (!team.inviteExpiresAt || team.inviteExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invite link has expired" },
        { status: 410 }
      )
    }

    // Requester must have a player profile
    const player = await prisma.player.findUnique({
      where:  { userId: session.user.id },
      select: { id: true },
    })
    if (!player) {
      return apiBadRequest(
        "You must complete your player profile before joining a team"
      )
    }

    // Player must not already be on active roster
    const existing = await prisma.teamMembership.findFirst({
      where:  { teamId: team.id, playerId: player.id, leftAt: null },
      select: { id: true },
    })
    if (existing) return apiConflict("You are already on this team's roster")

    // Enforce max roster size
    const activeCount = await prisma.teamMembership.count({
      where: { teamId: team.id, leftAt: null },
    })
    if (activeCount >= MAX_ROSTER_SIZE) {
      return apiBadRequest(
        `Roster is full — maximum ${MAX_ROSTER_SIZE} active members allowed`
      )
    }

    const membership = await prisma.teamMembership.create({
      data: {
        teamId:   team.id,
        playerId: player.id,
        role:     "PLAYER",
      },
      select: { id: true },
    })

    return NextResponse.json(membership, { status: 201 })
  } catch (err) {
    return apiInternalError(err, "POST /api/invite/:token")
  }
}

// ---------------------------------------------------------------------------
// GET — allow the invite page to fetch team info without joining
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const team = await prisma.team.findUnique({
      where:  { inviteToken: token, deletedAt: null },
      select: { id: true, name: true, logoUrl: true, inviteExpiresAt: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: "Invite link is invalid or has been revoked" },
        { status: 410 }
      )
    }

    if (!team.inviteExpiresAt || team.inviteExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invite link has expired" },
        { status: 410 }
      )
    }

    return NextResponse.json({
      id:             team.id,
      name:           team.name,
      logoUrl:        team.logoUrl,
      inviteExpiresAt: team.inviteExpiresAt,
    })
  } catch (err) {
    return apiInternalError(err, "GET /api/invite/:token")
  }
}
