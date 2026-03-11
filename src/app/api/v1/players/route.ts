/**
 * GET /api/v1/players
 *
 * Public — no auth required.
 * Paginated list of player profiles.
 *
 * Query params: search, page, pageSize
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiInternalError } from "@/lib/utils/errors"
import { v1RateLimit, attachRateLimitHeaders } from "@/lib/api/v1RateLimit"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants"
import type { Prisma } from "@prisma/client"

export async function GET(req: Request) {
  const rl = await v1RateLimit(req)
  if (rl.blocked) return rl.blocked

  try {
    const { searchParams } = new URL(req.url)

    const page     = Math.max(1, Number(searchParams.get("page")     ?? 1))
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)))
    const skip     = (page - 1) * pageSize
    const search   = searchParams.get("search")?.trim()

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

    const payload = {
      data:       players,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }

    return attachRateLimitHeaders(NextResponse.json(payload), rl.remaining)
  } catch (err) {
    return apiInternalError(err, "GET /api/v1/players")
  }
}
