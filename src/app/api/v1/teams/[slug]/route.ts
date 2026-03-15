/**
 * GET /api/v1/teams/:slug
 *
 * Public — no auth required.
 * Returns full team profile with active roster, looked up by slug.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiNotFound, apiInternalError } from "@/lib/utils/errors"
import { v1RateLimit, attachRateLimitHeaders } from "@/lib/api/v1RateLimit"

type Params = { params: Promise<{ slug: string }> }

export async function GET(req: Request, { params }: Params) {
  const rl = await v1RateLimit(req)
  if (rl.blocked) return rl.blocked

  const { slug } = await params

  try {
    const team = await prisma.team.findUnique({
      where:  { slug, deletedAt: null },
      select: {
        id:             true,
        slug:           true,
        name:           true,
        logoUrl:        true,
        primaryColor:   true,
        secondaryColor: true,
        website:        true,
        twitterHandle:  true,
        discordInvite:  true,
        createdAt:      true,
        memberships: {
          where:   { leftAt: null },
          orderBy: [{ isCaptain: "desc" }, { joinedAt: "asc" }],
          select: {
            id:           true,
            role:         true,
            isCaptain:    true,
            jerseyNumber: true,
            joinedAt:     true,
            player: {
              select: {
                id:              true,
                displayName:     true,
                avatarUrl:       true,
                trackerUrl:      true,
                discordUsername: true,
              },
            },
          },
        },
      },
    })

    if (!team) return apiNotFound("Team")

    return attachRateLimitHeaders(NextResponse.json(team), rl.remaining)
  } catch (err) {
    return apiInternalError(err, "GET /api/v1/teams/:slug")
  }
}
