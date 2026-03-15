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

import { createHmac, timingSafeEqual } from "crypto"
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
  const { getObject } = await import("@/lib/upload/storage")

  const obj = await getObject(fileKey)
  if (!obj.Body) throw new Error(`S3 object not found: ${fileKey}`)

  // Collect the stream into a byte array, then wrap in a Blob for FormData
  const bytes = await obj.Body.transformToByteArray()
  const blob  = new Blob([bytes.buffer as ArrayBuffer], { type: "application/octet-stream" })

  const filename = fileKey.split("/").pop() ?? "replay.replay"
  const form = new FormData()
  form.append("file", blob, filename)

  const res  = await ballchasingFetch("/v2/upload", { method: "POST", body: form })
  const json = (await res.json()) as { id: string; location: string }

  return { id: json.id, location: json.location }
}

// ---------------------------------------------------------------------------
// Status / polling
// ---------------------------------------------------------------------------

/**
 * Fetches the current parse status of a replay from ballchasing.com.
 */
export async function getReplayStatus(ballchasingId: string): Promise<BallchasingReplay> {
  const res = await ballchasingFetch(`/replays/${ballchasingId}`)
  return res.json() as Promise<BallchasingReplay>
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

/**
 * Verifies the HMAC-SHA256 signature on an incoming webhook from ballchasing.com.
 * Returns true if the signature is valid.
 *
 * @param rawBody   — Raw request body (Buffer or string)
 * @param signature — Value of the X-Ballchasing-Signature header (hex or "sha256=<hex>")
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): boolean {
  const secret = process.env.BALLCHASING_WEBHOOK_SECRET
  if (!secret) {
    console.warn("[ballchasing] BALLCHASING_WEBHOOK_SECRET is not set — skipping verification")
    return false
  }

  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8")
  const expected = createHmac("sha256", secret).update(body).digest("hex")
  const received = signature.replace(/^sha256=/, "")

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"))
  } catch {
    return false
  }
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
  if (replay.status === "pending") {
    return { status: "FAILED", errorMessage: "Replay is still pending on ballchasing.com" }
  }
  if (replay.status === "failed") {
    return { status: "FAILED", errorMessage: "ballchasing.com failed to parse the replay file" }
  }

  const awayColor = homeTeamColor === "blue" ? "orange" : "blue"
  const homeTeam  = replay[homeTeamColor]
  const awayTeam  = replay[awayColor]

  const players: ParsedPlayerStat[] = [
    ...homeTeam.players.map((p) => mapPlayer(p, "home")),
    ...awayTeam.players.map((p) => mapPlayer(p, "away")),
  ]

  // ballchasing doesn't always include team-level goals — fall back to summing player goals
  const homeGoals = homeTeam.goals ?? homeTeam.players.reduce((s, p) => s + (p.stats.core.goals ?? 0), 0)
  const awayGoals = awayTeam.goals ?? awayTeam.players.reduce((s, p) => s + (p.stats.core.goals ?? 0), 0)

  return {
    status:    "SUCCESS",
    homeGoals,
    awayGoals,
    duration:  replay.duration,
    overtime:  replay.overtime,
    players,
    rawJson:   replay,
  }
}

function mapPlayer(p: BallchasingPlayer, teamSide: "home" | "away"): ParsedPlayerStat {
  return {
    epicUsername:     p.name,
    teamSide,
    score:            p.stats.core.score,
    goals:            p.stats.core.goals,
    assists:          p.stats.core.assists,
    saves:            p.stats.core.saves,
    shots:            p.stats.core.shots,
    demos:            p.stats.core.demos_inflicted,
    boostUsed:        p.stats.boost?.amount_used_while_supersonic,
    avgBoostAmount:   p.stats.boost?.average_amount,
    timeSupersonic:   p.stats.movement?.time_supersonic_speed,
    distanceTraveled: p.stats.movement?.total_distance,
    timeInAir:        p.stats.movement?.time_air_time,
  }
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
      Authorization: apiKey,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`ballchasing.com ${options.method ?? "GET"} ${path} → ${res.status}: ${body}`)
  }

  return res
}
