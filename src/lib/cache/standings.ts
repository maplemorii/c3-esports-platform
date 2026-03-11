/**
 * cache/standings.ts
 *
 * Redis cache helpers for standings API responses.
 *
 * Keys:
 *   standings:division:{divisionId}  — single division response
 *   standings:season:{seasonId}      — all-divisions-in-season response
 *
 * TTL: 60 seconds. Standings are also explicitly invalidated whenever a
 * match completes or standings are recalculated.
 */

import { withRedis } from "@/lib/redis"

const TTL_SECONDS = 60

function divisionKey(divisionId: string) {
  return `standings:division:${divisionId}`
}

function seasonKey(seasonId: string) {
  return `standings:season:${seasonId}`
}

export async function getCachedDivisionStandings<T>(divisionId: string): Promise<T | null> {
  return withRedis(async (redis) => {
    const raw = await redis.get(divisionKey(divisionId))
    return raw ? (JSON.parse(raw) as T) : null
  }, null)
}

export async function setCachedDivisionStandings(divisionId: string, data: unknown): Promise<void> {
  await withRedis(async (redis) => {
    await redis.set(divisionKey(divisionId), JSON.stringify(data), "EX", TTL_SECONDS)
  }, undefined)
}

export async function getCachedSeasonStandings<T>(seasonId: string): Promise<T | null> {
  return withRedis(async (redis) => {
    const raw = await redis.get(seasonKey(seasonId))
    return raw ? (JSON.parse(raw) as T) : null
  }, null)
}

export async function setCachedSeasonStandings(seasonId: string, data: unknown): Promise<void> {
  await withRedis(async (redis) => {
    await redis.set(seasonKey(seasonId), JSON.stringify(data), "EX", TTL_SECONDS)
  }, undefined)
}

/**
 * Invalidates both division and season standings caches after a standings write.
 */
export async function invalidateStandingsCache(divisionId: string, seasonId: string): Promise<void> {
  await withRedis(async (redis) => {
    await redis.del(divisionKey(divisionId), seasonKey(seasonId))
  }, undefined)
}
