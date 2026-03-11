/**
 * GET /api/v1/players/:id
 *
 * Public — no auth required.
 * Returns player profile with full team membership history.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiNotFound, apiInternalError } from "@/lib/utils/errors"
import { v1RateLimit, attachRateLimitHeaders } from "@/lib/api/v1RateLimit"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const rl = await v1RateLimit(req)
  if (rl.blocked) return rl.blocked

  const { id } = await params

  try {
    const player = await prisma.player.findUnique({
      where:  { id, deletedAt: null },
      select: {
        id:              true,
        displayName:     true,
        avatarUrl:       true,
        epicUsername:    true,
        discordUsername: true,
        bio:             true,
        createdAt:       true,
        memberships: {
          orderBy: { joinedAt: "desc" },
          select: {
            id:           true,
            role:         true,
            isCaptain:    true,
            jerseyNumber: true,
            joinedAt:     true,
            leftAt:       true,
            team: {
              select: {
                id:           true,
                slug:         true,
                name:         true,
                logoUrl:      true,
                primaryColor: true,
              },
            },
          },
        },
      },
    })

    if (!player) return apiNotFound("Player")

    return attachRateLimitHeaders(NextResponse.json(player), rl.remaining)
  } catch (err) {
    return apiInternalError(err, "GET /api/v1/players/:id")
  }
}
