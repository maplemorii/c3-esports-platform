/**
 * /api/players/:playerId
 *
 * GET   — public; full player profile + team membership history
 * PATCH — authenticated; player may update their own profile; STAFF+ may update any
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"
import { UpdatePlayerSchema } from "@/lib/validators/player.schema"
import {
  parseBody,
  apiNotFound,
  apiForbidden,
  apiConflict,
  apiInternalError,
} from "@/lib/utils/errors"

// ---------------------------------------------------------------------------
// Shared selects
// ---------------------------------------------------------------------------

const PLAYER_SELECT = {
  id:              true,
  userId:          true,
  displayName:     true,
  avatarUrl:       true,
  epicUsername:    true,
  steamId:         true,
  discordUsername: true,
  bio:             true,
  createdAt:       true,
  updatedAt:       true,
} as const

const MEMBERSHIP_HISTORY_SELECT = {
  id:          true,
  role:        true,
  isCaptain:   true,
  jerseyNumber: true,
  joinedAt:    true,
  leftAt:      true,
  team: {
    select: {
      id:           true,
      slug:         true,
      name:         true,
      logoUrl:      true,
      primaryColor: true,
    },
  },
} as const

// ---------------------------------------------------------------------------
// GET /api/players/:playerId
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params

  try {
    const player = await prisma.player.findUnique({
      where:  { id: playerId, deletedAt: null },
      select: PLAYER_SELECT,
    })
    if (!player) return apiNotFound("Player")

    const memberships = await prisma.teamMembership.findMany({
      where:   { playerId },
      select:  MEMBERSHIP_HISTORY_SELECT,
      orderBy: { joinedAt: "desc" },
    })

    return NextResponse.json({ ...player, memberships })
  } catch (err) {
    return apiInternalError(err, "GET /api/players/:playerId")
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/players/:playerId
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params

  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  const { data, error: bodyError } = await parseBody(req, UpdatePlayerSchema)
  if (bodyError) return bodyError

  try {
    const player = await prisma.player.findUnique({
      where:  { id: playerId, deletedAt: null },
      select: { id: true, userId: true, epicUsername: true, steamId: true },
    })
    if (!player) return apiNotFound("Player")

    // Only the owning user or STAFF+ may update
    const isSelf  = player.userId === session.user.id
    const isStaff = hasMinRole(session.user.role, "STAFF")
    if (!isSelf && !isStaff) return apiForbidden()

    // epicUsername uniqueness (if changing)
    if (data.epicUsername && data.epicUsername !== player.epicUsername) {
      const taken = await prisma.player.findUnique({
        where:  { epicUsername: data.epicUsername },
        select: { id: true },
      })
      if (taken) return apiConflict(`Epic username "${data.epicUsername}" is already in use`)
    }

    // steamId uniqueness (if changing)
    if (data.steamId && data.steamId !== player.steamId) {
      const taken = await prisma.player.findUnique({
        where:  { steamId: data.steamId },
        select: { id: true },
      })
      if (taken) return apiConflict(`Steam ID "${data.steamId}" is already linked to another account`)
    }

    const updated = await prisma.player.update({
      where:  { id: playerId },
      data,
      select: PLAYER_SELECT,
    })

    return NextResponse.json(updated)
  } catch (err) {
    return apiInternalError(err, "PATCH /api/players/:playerId")
  }
}
