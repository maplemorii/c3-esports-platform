/**
 * Rate-limit helper for the public /api/v1/ endpoints.
 *
 * 60 requests / 60 seconds per IP — generous for community tools but
 * enough to prevent accidental hammering.
 */

import { NextResponse } from "next/server"
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit"

const LIMIT  = 60
const WINDOW = 60 // seconds

/** Returns { blocked } if rate-limited, or { remaining } if allowed. */
export async function v1RateLimit(
  req: Request,
): Promise<{ blocked: NextResponse; remaining?: never } | { blocked: null; remaining: number }> {
  const result = await rateLimit(req, "public-api-v1", LIMIT, WINDOW)
  if (!result.success) return { blocked: rateLimitResponse(result.retryAfter) }
  return { blocked: null, remaining: result.remaining }
}

/** Attach X-RateLimit-* headers to an existing NextResponse. */
export function attachRateLimitHeaders(res: NextResponse, remaining: number): NextResponse {
  res.headers.set("X-RateLimit-Limit",     String(LIMIT))
  res.headers.set("X-RateLimit-Remaining", String(remaining))
  res.headers.set("X-RateLimit-Window",    `${WINDOW}s`)
  return res
}
