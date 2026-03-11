/**
 * GET /api/v1/teams
 *
 * Public — no auth required.
 * Paginated list of active teams.
 *
 * Query params: search, seasonId, page, pageSize
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
    const seasonId = searchParams.get("seasonId")?.trim()

    const where: Prisma.TeamWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(seasonId && {
        registrations: { some: { seasonId, status: { in: ["APPROVED", "PENDING"] } } },
      }),
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        select: {
          id:           true,
          slug:         true,
          name:         true,
          logoUrl:      true,
          primaryColor: true,
          website:      true,
          twitterHandle: true,
        },
        orderBy: { name: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.team.count({ where }),
    ])

    const payload = {
      data:       teams,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }

    return attachRateLimitHeaders(NextResponse.json(payload), rl.remaining)
  } catch (err) {
    return apiInternalError(err, "GET /api/v1/teams")
  }
}
