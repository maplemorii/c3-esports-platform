/**
 * rateLimit.ts
 *
 * Sliding-window rate limiter with two backends:
 *  - Redis  (when REDIS_URL is set) — persists across instances, suitable for prod
 *  - Memory (fallback)              — single-instance only, suitable for dev
 *
 * Usage:
 *   const { success, retryAfter } = await rateLimit(req, "auth", 5, 60)
 *   if (!success) return rateLimitResponse(retryAfter)
 *
 * Keys are composed of: <namespace>:<ip|userId>
 */

import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getRedis } from "@/lib/redis"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  /** true → request is allowed */
  success:    boolean
  /** remaining allowed requests in this window */
  remaining:  number
  /** seconds until the window resets (only meaningful when success=false) */
  retryAfter: number
}

// ---------------------------------------------------------------------------
// In-memory fallback store
// ---------------------------------------------------------------------------

interface WindowEntry {
  timestamps: number[]
  expiresAt:  number
}

const store = new Map<string, WindowEntry>()

// Prune stale entries every 5 minutes to avoid unbounded memory growth
const GC_INTERVAL_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.expiresAt < now) store.delete(key)
  }
}, GC_INTERVAL_MS).unref()

function rateLimitMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now    = Date.now()
  const cutoff = now - windowMs

  const entry = store.get(key) ?? { timestamps: [], expiresAt: 0 }
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= limit) {
    const oldest     = entry.timestamps[0]
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
    store.set(key, entry)
    return { success: false, remaining: 0, retryAfter }
  }

  entry.timestamps.push(now)
  entry.expiresAt = now + windowMs
  store.set(key, entry)

  return { success: true, remaining: limit - entry.timestamps.length, retryAfter: 0 }
}

// ---------------------------------------------------------------------------
// Redis sliding window (sorted set)
// ---------------------------------------------------------------------------

async function rateLimitRedis(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const redis    = getRedis()!
  const now      = Date.now()
  const windowMs = windowSec * 1000
  const cutoff   = now - windowMs
  const redisKey = `ratelimit:${key}`

  // Atomic pipeline: prune expired, add current timestamp, count, set TTL
  const results = await redis
    .pipeline()
    .zremrangebyscore(redisKey, 0, cutoff)
    .zadd(redisKey, now, `${now}-${Math.random()}`)
    .zcard(redisKey)
    .expire(redisKey, windowSec + 1)
    .exec()

  const total = (results?.[2]?.[1] as number) ?? 0

  if (total > limit) {
    const oldest = await redis.zrange(redisKey, 0, 0, "WITHSCORES")
    const oldestTs   = oldest.length >= 2 ? Number(oldest[1]) : now
    const retryAfter = Math.max(1, Math.ceil((oldestTs + windowMs - now) / 1000))
    return { success: false, remaining: 0, retryAfter }
  }

  return { success: true, remaining: limit - total, retryAfter: 0 }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check and record a rate-limit hit.
 *
 * @param req        Incoming request (used to extract the client IP)
 * @param namespace  Logical bucket name, e.g. "auth", "edu-verify"
 * @param limit      Max requests allowed in the window
 * @param windowSec  Window duration in seconds
 * @param userId     Optional: key by user ID instead of IP
 */
export async function rateLimit(
  req: Request,
  namespace: string,
  limit: number,
  windowSec: number,
  userId?: string
): Promise<RateLimitResult> {
  const ip  = getIp(req)
  const key = `${namespace}:${userId ?? ip}`

  try {
    const redis = getRedis()
    const result = redis
      ? await rateLimitRedis(key, limit, windowSec)
      : rateLimitMemory(key, limit, windowSec * 1000)

    if (!result.success) {
      logger.warn({ key, limit, windowSec, retryAfter: result.retryAfter }, "Rate limit exceeded")
    }

    return result
  } catch (err) {
    // If Redis fails mid-request, fall back to memory so we never block the request
    logger.warn({ err, key }, "[rateLimit] Redis error, using memory fallback")
    return rateLimitMemory(key, limit, windowSec * 1000)
  }
}

// ---------------------------------------------------------------------------
// Response helper
// ---------------------------------------------------------------------------

/**
 * Returns a 429 JSON response with Retry-After and X-RateLimit headers.
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again." },
    {
      status:  429,
      headers: {
        "Retry-After":           String(retryAfter),
        "X-RateLimit-Remaining": "0",
      },
    }
  )
}

// ---------------------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------------------

function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}
