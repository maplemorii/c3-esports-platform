/**
 * ballchasing.service.ts
 *
 * Thin HTTP client wrapper for the ballchasing.com API.
 * All external communication with ballchasing.com goes through this module.
 *
 * Docs: https://ballchasing.com/doc/api
 *
 * Environment variables required:
 *   BALLCHASING_API_KEY          — API key from https://ballchasing.com/upload
 *   BALLCHASING_WEBHOOK_SECRET   — Shared secret for webhook signature verification
 */

import type { ParseResult, ParsedPlayerStat } from "./replay.service"

const BASE_URL = "https://ballchasing.com/api"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BallchasingUploadResult {
  id: string       // ballchasingId to store on ReplayUpload
  location: string // URL to the replay page: https://ballchasing.com/replay/:id
}

/** Shape of the relevant fields from ballchasing.com's replay response. */
export interface BallchasingReplay {
  id: string
  status: "ok" | "pending" | "failed"
  blue: BallchasingTeam
  orange: BallchasingTeam
  duration: number
  overtime: boolean
  overtime_seconds?: number
}

export interface BallchasingTeam {
  goals: number
  players: BallchasingPlayer[]
}

export interface BallchasingPlayer {
  name: string
  stats: {
    core: {
      score: number
      goals: number
      assists: number
      saves: number
      shots: number
      demos_inflicted: number
    }
    boost?: {
      amount_used_while_supersonic: number
      average_amount: number
      time_full_boost: number
    }
    movement?: {
      total_distance: number
      time_supersonic_speed: number
      time_air_time: number
    }
  }
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Uploads a .replay file (by streaming it from S3/R2) to ballchasing.com.
 * Returns the ballchasingId and page URL.
 */
export async function uploadReplay(fileKey: string): Promise<BallchasingUploadResult> {
  // TODO:
  // 1. Stream file from S3/R2 using fileKey (via storage.ts)
  // 2. POST https://ballchasing.com/api/v3/upload
  //    Headers: Authorization: Token ${BALLCHASING_API_KEY}
  //    Body: multipart/form-data with the .replay file
  // 3. Return { id, location } from the response
  throw new Error("Not implemented: uploadReplay")
}

// ---------------------------------------------------------------------------
// Status / polling
// ---------------------------------------------------------------------------

/**
 * Fetches the current parse status of a replay from ballchasing.com.
 */
export async function getReplayStatus(ballchasingId: string): Promise<BallchasingReplay> {
  // TODO:
  // 1. GET https://ballchasing.com/api/v3/replays/:ballchasingId
  //    Headers: Authorization: Token ${BALLCHASING_API_KEY}
  // 2. Return parsed JSON
  throw new Error("Not implemented: getReplayStatus")
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

/**
 * Verifies the HMAC-SHA256 signature on an incoming webhook from ballchasing.com.
 * Returns true if the signature is valid.
 *
 * @param rawBody   — Raw request body (Buffer or string)
 * @param signature — Value of the X-Ballchasing-Signature header
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): boolean {
  // TODO:
  // 1. HMAC-SHA256(rawBody, BALLCHASING_WEBHOOK_SECRET)
  // 2. Compare with signature using timingSafeEqual to prevent timing attacks
  // import { createHmac, timingSafeEqual } from "crypto"
  throw new Error("Not implemented: verifyWebhookSignature")
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

/**
 * Converts a ballchasing.com replay response into the platform's ParseResult shape.
 * Determines which team color maps to home/away based on homeTeamColor hint.
 *
 * @param replay         — Raw ballchasing.com replay object
 * @param homeTeamColor  — "blue" | "orange" (stored on ReplayUpload from uploader hint)
 */
export function toParseResult(
  replay: BallchasingReplay,
  homeTeamColor: "blue" | "orange" = "blue"
): ParseResult {
  // TODO:
  // 1. Map homeTeamColor to replay.blue / replay.orange
  // 2. Extract homeGoals, awayGoals, duration, overtime
  // 3. Map each player's stats to ParsedPlayerStat
  // 4. Return ParseResult
  throw new Error("Not implemented: toParseResult")
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function ballchasingFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = process.env.BALLCHASING_API_KEY
  if (!apiKey) throw new Error("BALLCHASING_API_KEY is not set")

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Token ${apiKey}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`ballchasing.com ${options.method ?? "GET"} ${path} → ${res.status}: ${body}`)
  }

  return res
}
