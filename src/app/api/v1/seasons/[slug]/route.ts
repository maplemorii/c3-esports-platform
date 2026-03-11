/**
 * GET /api/v1/seasons/:slug
 *
 * Public — no auth required.
 * Returns a single season with its divisions, looked up by slug.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiNotFound, apiInternalError } from "@/lib/utils/errors"
import { v1RateLimit, attachRateLimitHeaders } from "@/lib/api/v1RateLimit"
import { SEASON_SELECT } from "@/app/api/seasons/route"

type Params = { params: Promise<{ slug: string }> }

export async function GET(req: Request, { params }: Params) {
  const rl = await v1RateLimit(req)
  if (rl.blocked) return rl.blocked

  const { slug } = await params

  try {
    const season = await prisma.season.findUnique({
      where:  { slug, isVisible: true },
      select: SEASON_SELECT,
    })

    if (!season) return apiNotFound("Season")

    return attachRateLimitHeaders(NextResponse.json(season), rl.remaining)
  } catch (err) {
    return apiInternalError(err, "GET /api/v1/seasons/:slug")
  }
}
