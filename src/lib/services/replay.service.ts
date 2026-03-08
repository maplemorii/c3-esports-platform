/**
 * replay.service.ts
 *
 * Replay upload and parse pipeline.
 *
 * Full flow per game slot:
 *  1. Team uploads .replay file to S3/R2 via presigned URL
 *  2. POST /api/matches/:id/replays → createReplayUpload() records the fileKey
 *  3. submitToBallchasing() streams the file to ballchasing.com → stores ballchasingId
 *  4. Webhook (or poll) calls handleParseResult() with the parsed data
 *  5. If SUCCESS:
 *     a. createMatchGameFromReplay() — upserts MatchGame (source=REPLAY_AUTO)
 *     b. createPlayerStats() — creates ReplayPlayerStat rows
 *     c. Increments Match.replaysVerified
 *     d. checkFastPath() — if all games verified, transitions match to COMPLETED or VERIFYING
 *  6. If FAILED:
 *     a. Marks slot as FAILED
 *     b. Notifies submitting team (future: email/Discord)
 */

import { prisma } from "@/lib/prisma"
import type { ReplayUpload, ReplayParseStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateReplayUploadInput {
  matchId: string
  gameNumber: number
  fileKey: string
  uploadedById: string
  uploadedByTeamId: string
}

export interface ParsedPlayerStat {
  epicUsername: string
  teamSide: "home" | "away"
  score: number
  goals: number
  assists: number
  saves: number
  shots: number
  demos: number
  boostUsed?: number
  avgBoostAmount?: number
  timeSupersonic?: number
  distanceTraveled?: number
  timeInAir?: number
  boostCollected?: number
}

export interface ParseResult {
  status: "SUCCESS" | "FAILED"
  homeGoals?: number
  awayGoals?: number
  duration?: number
  overtime?: boolean
  players?: ParsedPlayerStat[]
  rawJson?: unknown
  errorMessage?: string
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Records a new replay upload in the DB and enqueues the parse job.
 * Replaces any existing upload for the same (matchId, gameNumber) slot.
 */
export async function createReplayUpload(
  input: CreateReplayUploadInput
): Promise<ReplayUpload> {
  // TODO:
  // 1. Guard: match status must be IN_PROGRESS
  // 2. prisma.replayUpload.upsert({ where: { matchId_gameNumber } })
  // 3. Call submitToBallchasing(replayUpload.id) — can be fire-and-forget
  // 4. Return the created record
  throw new Error("Not implemented: createReplayUpload")
}

/**
 * Deletes a replay upload, resetting that game slot to manual entry.
 * Only allowed before the match reaches COMPLETED.
 */
export async function deleteReplayUpload(
  matchId: string,
  gameNumber: number
): Promise<void> {
  // TODO:
  // 1. Fetch the ReplayUpload; guard: match not COMPLETED
  // 2. Delete ReplayPlayerStat rows (cascade handles this if schema is set)
  // 3. Delete the linked MatchGame if source=REPLAY_AUTO
  // 4. Decrement Match.replaysVerified if the slot was SUCCESS
  // 5. prisma.replayUpload.delete(...)
  throw new Error("Not implemented: deleteReplayUpload")
}

// ---------------------------------------------------------------------------
// Parse pipeline
// ---------------------------------------------------------------------------

/**
 * Submits the replay file to ballchasing.com for parsing.
 * Updates parseStatus to PROCESSING and stores the ballchasingId.
 */
export async function submitToBallchasing(replayUploadId: string): Promise<void> {
  // TODO:
  // 1. Fetch ReplayUpload (fileKey, matchId, gameNumber)
  // 2. Stream file from S3/R2 using fileKey
  // 3. POST to ballchasing.com /api/v3/upload → receive ballchasingId
  // 4. prisma.replayUpload.update({ parseStatus: "PROCESSING", ballchasingId, ballchasingUrl, parseStartedAt: now() })
  // See ballchasing.service.ts for the API client wrapper
  throw new Error("Not implemented: submitToBallchasing")
}

/**
 * Processes a parse result from ballchasing.com (via webhook or poll).
 * This is the main integration point — orchestrates downstream effects.
 */
export async function handleParseResult(
  replayUploadId: string,
  result: ParseResult
): Promise<void> {
  // TODO:
  // 1. Fetch ReplayUpload
  // 2. If FAILED:
  //    a. Update parseStatus=FAILED, parseError, parseCompletedAt
  //    b. (future) Notify team
  //    c. Return
  // 3. If SUCCESS:
  //    a. Update ReplayUpload with parsed fields, parseStatus=SUCCESS, scoresAccepted=true
  //    b. createMatchGameFromReplay(replayUpload, result)
  //    c. createPlayerStats(replayUploadId, result.players)
  //    d. Increment Match.replaysVerified (atomic: $executeRaw or update + select)
  //    e. checkFastPath(replayUpload.matchId)
  throw new Error("Not implemented: handleParseResult")
}

/**
 * Re-triggers parsing for a FAILED replay slot (staff action).
 */
export async function retriggerParse(
  replayUploadId: string,
  staffId: string
): Promise<void> {
  // TODO:
  // 1. Reset parseStatus=PENDING, clear parseError
  // 2. Write AuditLog: action="REPLAY_REPARSE_TRIGGERED"
  // 3. Call submitToBallchasing(replayUploadId)
  throw new Error("Not implemented: retriggerParse")
}

// ---------------------------------------------------------------------------
// Post-parse effects
// ---------------------------------------------------------------------------

/**
 * Upserts a MatchGame row from successfully parsed replay data.
 */
export async function createMatchGameFromReplay(
  replayUploadId: string,
  result: ParseResult
): Promise<void> {
  // TODO:
  // 1. Fetch ReplayUpload (matchId, gameNumber)
  // 2. prisma.matchGame.upsert({ where: { matchId_gameNumber }, source: "REPLAY_AUTO", replayUploadId })
  throw new Error("Not implemented: createMatchGameFromReplay")
}

/**
 * Creates ReplayPlayerStat rows from parsed player data.
 */
export async function createPlayerStats(
  replayUploadId: string,
  players: ParsedPlayerStat[]
): Promise<void> {
  // TODO:
  // 1. For each player: try to match epicUsername to a Player.id
  // 2. prisma.replayPlayerStat.createMany(...)
  throw new Error("Not implemented: createPlayerStats")
}

/**
 * Checks whether the dual-upload fast path applies after a parse succeeds.
 *
 * Fast path: all expected game slots have a SUCCESS replay for BOTH teams
 *   → skip VERIFYING, go straight to COMPLETED
 *
 * Single-upload path: all slots SUCCESS but only one team uploaded
 *   → VERIFYING (opponent must confirm)
 *
 * Not ready: some slots still PENDING/PROCESSING/FAILED
 *   → do nothing yet
 */
export async function checkFastPath(matchId: string): Promise<void> {
  // TODO:
  // 1. Fetch match: gamesExpected, replaysVerified, homeTeamId, awayTeamId
  // 2. If replaysVerified < gamesExpected: return (not all done yet)
  // 3. Fetch all ReplayUpload rows for matchId where parseStatus=SUCCESS
  // 4. Check if both teams have uploaded → fast path → COMPLETED
  // 5. Otherwise → VERIFYING
  throw new Error("Not implemented: checkFastPath")
}

// ---------------------------------------------------------------------------
// Polling (cron fallback)
// ---------------------------------------------------------------------------

/**
 * Polls ballchasing.com for the status of all PROCESSING replays.
 * Fallback for when webhooks are not delivered.
 */
export async function pollProcessingReplays(): Promise<void> {
  // TODO:
  // 1. Fetch all ReplayUpload WHERE parseStatus=PROCESSING
  // 2. For each: GET ballchasing.com /api/v3/replays/:ballchasingId
  // 3. If done: handleParseResult(...)
  // 4. If stale (parseStartedAt > threshold): escalate if match is VERIFYING → DISPUTED
  throw new Error("Not implemented: pollProcessingReplays")
}
