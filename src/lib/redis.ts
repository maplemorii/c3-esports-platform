/**
 * redis.ts
 *
 * Lazy ioredis singleton. Returns null when REDIS_URL is absent so the
 * app degrades gracefully (in-memory rate limiter, no standings cache).
 *
 * Usage:
 *   import { getRedis } from "@/lib/redis"
 *   const redis = getRedis()
 *   if (redis) { await redis.set(...) }
 */

import Redis from "ioredis"
import { logger } from "@/lib/logger"

let _client: Redis | null = null

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null

  if (!_client) {
    _client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,     // fail fast — don't block requests
      enableOfflineQueue:   false, // drop commands when disconnected
      lazyConnect:          false,
    })

    _client.on("error", (err: Error) => {
      logger.warn({ err: err.message }, "[redis] connection error")
    })

    _client.on("connect", () => {
      logger.info("[redis] connected")
    })
  }

  return _client
}

/** Convenience: run a command only if Redis is available, otherwise return fallback. */
export async function withRedis<T>(
  fn: (redis: Redis) => Promise<T>,
  fallback: T
): Promise<T> {
  const redis = getRedis()
  if (!redis) return fallback
  try {
    return await fn(redis)
  } catch (err) {
    logger.warn({ err }, "[redis] command failed, using fallback")
    return fallback
  }
}
