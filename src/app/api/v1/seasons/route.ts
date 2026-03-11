/**
 * GET /api/v1/seasons
 *
 * Public — no auth required.
 * Returns all visible seasons, optionally filtered by status.
 * Query params: status (DRAFT|REGISTRATION|ACTIVE|PLAYOFFS|COMPLETED|CANCELLED)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiInternalError } from "@/lib/utils/errors"
import { v1RateLimit, attachRateLimitHeaders } from "@/lib/api/v1RateLimit"
import { SEASON_SELECT } from "@/app/api/seasons/route"
import type { SeasonStatus } from "@prisma/client"

const VALID_STATUSES: SeasonStatus[] = [
  "DRAFT", "REGISTRATION", "ACTIVE", "PLAYOFFS", "COMPLETED", "CANCELLED",
]

export async function GET(req: Request) {
  const rl = await v1RateLimit(req)
  if (rl.blocked) return rl.blocked

  try {
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get("status")?.toUpperCase()
    const statusFilter: SeasonStatus | undefined =
      statusParam && VALID_STATUSES.includes(statusParam as SeasonStatus)
        ? (statusParam as SeasonStatus)
        : undefined

    const seasons = await prisma.season.findMany({
      where:   { isVisible: true, ...(statusFilter ? { status: statusFilter } : {}) },
      orderBy: { createdAt: "desc" },
      select:  SEASON_SELECT,
    })

    return attachRateLimitHeaders(NextResponse.json(seasons), rl.remaining)
  } catch (err) {
    return apiInternalError(err, "GET /api/v1/seasons")
  }
}
