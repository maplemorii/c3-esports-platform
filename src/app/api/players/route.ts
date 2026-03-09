/**
 * /api/players
 *
 * GET  — public; paginated list of player profiles
 *         Query params: search, page, pageSize
 *
 * POST — authenticated (any USER+); create the caller's player profile
 *         One profile per user — enforced at the DB level (Player.userId @unique)
 *         and validated here before attempting the insert.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { CreatePlayerSchema } from "@/lib/validators/player.schema"
import {
  parseBody,
  apiConflict,
  apiInternalError,
} from "@/lib/utils/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants"
import type { Prisma } from "@prisma/client"

// ---------------------------------------------------------------------------
// GET /api/players
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    const page     = Math.max(1, Number(searchParams.get("page") ?? 1))
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)))
    const skip     = (page - 1) * pageSize

    const search  = searchParams.get("search")?.trim()

    const where: Prisma.PlayerWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { displayName:     { contains: search, mode: "insensitive" } },
          { epicUsername:    { contains: search, mode: "insensitive" } },
          { discordUsername: { contains: search, mode: "insensitive" } },
        ],
      }),
    }

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        select: {
          id:              true,
          displayName:     true,
          avatarUrl:       true,
          epicUsername:    true,
          discordUsername: true,
        },
        orderBy: { displayName: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.player.count({ where }),
    ])

    return NextResponse.json({
      data:       players,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    return apiInternalError(err, "GET /api/players")
  }
}

// ---------------------------------------------------------------------------
// POST /api/players
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  const { data, error: bodyError } = await parseBody(req, CreatePlayerSchema)
  if (bodyError) return bodyError

  try {
    // One profile per user
    const existingProfile = await prisma.player.findUnique({
      where:  { userId: session.user.id },
      select: { id: true },
    })
    if (existingProfile) {
      return apiConflict("You already have a player profile")
    }

    // epicUsername uniqueness
    if (data.epicUsername) {
      const taken = await prisma.player.findUnique({
        where:  { epicUsername: data.epicUsername },
        select: { id: true },
      })
      if (taken) return apiConflict(`Epic username "${data.epicUsername}" is already in use`)
    }

    // steamId uniqueness
    if (data.steamId) {
      const taken = await prisma.player.findUnique({
        where:  { steamId: data.steamId },
        select: { id: true },
      })
      if (taken) return apiConflict(`Steam ID "${data.steamId}" is already linked to another account`)
    }

    const player = await prisma.player.create({
      data: {
        userId:          session.user.id,
        displayName:     data.displayName,
        epicUsername:    data.epicUsername,
        steamId:         data.steamId,
        discordUsername: data.discordUsername,
        bio:             data.bio,
      },
      select: {
        id:              true,
        userId:          true,
        displayName:     true,
        avatarUrl:       true,
        epicUsername:    true,
        steamId:         true,
        discordUsername: true,
        bio:             true,
        createdAt:       true,
      },
    })

    return NextResponse.json(player, { status: 201 })
  } catch (err) {
    return apiInternalError(err, "POST /api/players")
  }
}
