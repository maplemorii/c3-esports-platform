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

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { applyMatchToStandings } from "@/lib/services/standings.service"
import { sendParseFailedEmail } from "@/lib/email"
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
  input: CreateReplayUploadInput & { homeTeamColor?: string }
): Promise<ReplayUpload> {
  const { matchId, gameNumber, fileKey, uploadedById, uploadedByTeamId, homeTeamColor } = input

  // Guard: match must exist and be in a state that accepts uploads
  const match = await prisma.match.findUnique({
    where: { id: matchId, deletedAt: null },
    select: { status: true, gamesExpected: true },
  })

  if (!match) {
    throw new Error("Match not found")
  }

  const uploadableStatuses = ["IN_PROGRESS", "MATCH_FINISHED"]
  if (!uploadableStatuses.includes(match.status)) {
    throw new Error(
      `Replays can only be uploaded when the match is IN_PROGRESS or MATCH_FINISHED (current: ${match.status})`
    )
  }

  if (match.gamesExpected !== null && (gameNumber < 1 || gameNumber > match.gamesExpected)) {
    throw new Error(
      `gameNumber must be between 1 and ${match.gamesExpected} for this match`
    )
  }

  // If a previous upload exists for this slot, clean up any REPLAY_AUTO game result
  const existing = await prisma.replayUpload.findUnique({
    where: { matchId_gameNumber: { matchId, gameNumber } },
    select: { id: true, gameResult: { select: { id: true, source: true } } },
  })

  if (existing?.gameResult?.source === "REPLAY_AUTO") {
    await prisma.matchGame.delete({ where: { id: existing.gameResult.id } })
  }

  // Upsert the slot — always resets to PENDING so the parse pipeline restarts
  const upload = await prisma.replayUpload.upsert({
    where: { matchId_gameNumber: { matchId, gameNumber } },
    create: {
      matchId,
      gameNumber,
      fileKey,
      uploadedById,
      uploadedByTeamId,
      homeTeamColor: homeTeamColor ?? null,
      parseStatus: "PENDING",
    },
    update: {
      fileKey,
      uploadedById,
      uploadedByTeamId,
      homeTeamColor: homeTeamColor ?? null,
      parseStatus:      "PENDING",
      parseStartedAt:   null,
      parseCompletedAt: null,
      parseError:       null,
      ballchasingId:    null,
      ballchasingUrl:   null,
      parsedData:       Prisma.DbNull,
      parsedHomeGoals:  null,
      parsedAwayGoals:  null,
      parsedDuration:   null,
      parsedOvertime:   null,
      scoresAccepted:   false,
    },
  })

  // Fire-and-forget: submit to ballchasing.com for parsing.
  // On failure we mark the slot FAILED immediately so the user sees feedback
  // rather than the slot staying PENDING indefinitely.
  submitToBallchasing(upload.id).catch(async (err) => {
    console.error(`[replay] submitToBallchasing failed for upload ${upload.id}:`, err)
    await prisma.replayUpload.update({
      where: { id: upload.id },
      data: {
        parseStatus:      "FAILED",
        parseError:       err instanceof Error ? err.message : "Failed to submit replay to ballchasing.com",
        parseCompletedAt: new Date(),
      },
    }).catch((dbErr) => {
      console.error(`[replay] could not mark upload ${upload.id} as FAILED:`, dbErr)
    })
  })

  return upload
}

/**
 * Deletes a replay upload, resetting that game slot to manual entry.
 * Only allowed before the match reaches COMPLETED.
 */
export async function deleteReplayUpload(
  matchId: string,
  gameNumber: number
): Promise<void> {
  const upload = await prisma.replayUpload.findUnique({
    where: { matchId_gameNumber: { matchId, gameNumber } },
    select: {
      id:          true,
      parseStatus: true,
      gameResult:  { select: { id: true, source: true } },
      match:       { select: { status: true } },
    },
  })

  if (!upload) throw new Error("Replay upload not found")

  const terminalStatuses = ["COMPLETED", "CANCELLED", "FORFEITED", "NO_SHOW"]
  if (terminalStatuses.includes(upload.match.status)) {
    throw new Error(`Cannot remove a replay from a match in ${upload.match.status} status`)
  }

  // Delete the auto-generated MatchGame if one exists (player stats cascade via DB)
  if (upload.gameResult?.source === "REPLAY_AUTO") {
    await prisma.matchGame.delete({ where: { id: upload.gameResult.id } })
  }

  // Decrement replaysVerified if this slot was previously successful
  if (upload.parseStatus === "SUCCESS") {
    await prisma.match.update({
      where: { id: matchId },
      data:  { replaysVerified: { decrement: 1 } },
    })
  }

  // Delete upload (ReplayPlayerStat rows cascade via schema)
  await prisma.replayUpload.delete({ where: { id: upload.id } })
}

// ---------------------------------------------------------------------------
// Parse pipeline
// ---------------------------------------------------------------------------

/**
 * Submits the replay file to ballchasing.com for parsing.
 * Updates parseStatus to PROCESSING and stores the ballchasingId.
 */
export async function submitToBallchasing(replayUploadId: string): Promise<void> {
  const upload = await prisma.replayUpload.findUnique({
    where:  { id: replayUploadId },
    select: { id: true, fileKey: true },
  })
  if (!upload) throw new Error(`ReplayUpload ${replayUploadId} not found`)

  const { uploadReplay } = await import("@/lib/services/ballchasing.service")
  const { id: ballchasingId, location: ballchasingUrl } = await uploadReplay(upload.fileKey)

  await prisma.replayUpload.update({
    where: { id: replayUploadId },
    data: {
      parseStatus:    "PROCESSING",
      ballchasingId,
      ballchasingUrl,
      parseStartedAt: new Date(),
    },
  })
}

/**
 * Processes a parse result from ballchasing.com (via webhook or poll).
 * This is the main integration point — orchestrates downstream effects.
 */
export async function handleParseResult(
  replayUploadId: string,
  result: ParseResult
): Promise<void> {
  const upload = await prisma.replayUpload.findUnique({
    where: { id: replayUploadId },
    select: {
      id:               true,
      matchId:          true,
      gameNumber:       true,
      fileKey:          true,
      uploadedById:     true,
      uploadedByTeamId: true,
      match: {
        select: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
    },
  })
  if (!upload) throw new Error(`ReplayUpload ${replayUploadId} not found`)

  const now = new Date()

  if (result.status === "FAILED") {
    await prisma.replayUpload.update({
      where: { id: replayUploadId },
      data: {
        parseStatus:      "FAILED",
        parseError:       result.errorMessage ?? "Unknown parse error",
        parseCompletedAt: now,
      },
    })

    // Notify the uploader if they have replay notifications enabled (fire-and-forget)
    if (upload.uploadedById) {
      prisma.user.findUnique({
        where:  { id: upload.uploadedById },
        select: { email: true, name: true, emailNotifReplays: true },
      }).then((uploader) => {
        if (uploader?.email && uploader.emailNotifReplays) {
          const filename = upload.fileKey.split("/").pop() ?? upload.fileKey
          return sendParseFailedEmail({
            to:            uploader.email,
            recipientName: uploader.name ?? "Manager",
            matchId:       upload.matchId,
            homeTeam:      upload.match?.homeTeam?.name ?? "Home",
            awayTeam:      upload.match?.awayTeam?.name ?? "Away",
            filename,
          })
        }
      }).catch((err) => {
        console.error(`[replay] failed to send parse-failed email for upload ${replayUploadId}:`, err)
      })
    }

    return
  }

  // MISMATCH check — if a manual MatchGame already exists for this slot with
  // different scores, flag the slot and auto-dispute rather than overwriting.
  const existingGame = await prisma.matchGame.findUnique({
    where:  { matchId_gameNumber: { matchId: upload.matchId, gameNumber: upload.gameNumber } },
    select: { source: true, homeGoals: true, awayGoals: true },
  })

  const hasManualEntry = existingGame?.source === "MANUAL"
  const scoresConflict =
    hasManualEntry &&
    (existingGame!.homeGoals !== result.homeGoals ||
      existingGame!.awayGoals !== result.awayGoals)

  if (scoresConflict) {
    await prisma.replayUpload.update({
      where: { id: replayUploadId },
      data: {
        parseStatus:      "MISMATCH",
        parseCompletedAt: now,
        parseError:       null,
        parsedHomeGoals:  result.homeGoals  ?? null,
        parsedAwayGoals:  result.awayGoals  ?? null,
        parsedDuration:   result.duration   ?? null,
        parsedOvertime:   result.overtime   ?? null,
        parsedData: result.rawJson ?? Prisma.JsonNull,
        scoresAccepted:   false,
      },
    })

    const reason =
      `Score mismatch on game ${upload.gameNumber}: ` +
      `replay shows ${result.homeGoals}–${result.awayGoals}, ` +
      `manual entry shows ${existingGame!.homeGoals}–${existingGame!.awayGoals}.`

    // Upsert dispute (matchId is unique on Dispute)
    await prisma.dispute.upsert({
      where:  { matchId: upload.matchId },
      create: {
        matchId:       upload.matchId,
        filedByUserId: upload.uploadedById,
        filedByTeamId: upload.uploadedByTeamId,
        reason,
        status:        "OPEN",
      },
      update: { reason },
    })

    await prisma.match.update({
      where: { id: upload.matchId },
      data:  { status: "DISPUTED" },
    })

    return
  }

  // SUCCESS path — create game rows first, then mark SUCCESS so a failure
  // mid-way leaves the upload in PROCESSING (retriable) rather than SUCCESS
  // with no game data.
  await createMatchGameFromReplay(replayUploadId, result)

  if (result.players?.length) {
    await createPlayerStats(replayUploadId, result.players)
  }

  await prisma.replayUpload.update({
    where: { id: replayUploadId },
    data: {
      parseStatus:      "SUCCESS",
      parseCompletedAt: now,
      parseError:       null,
      parsedHomeGoals:  result.homeGoals                           ?? null,
      parsedAwayGoals:  result.awayGoals                           ?? null,
      parsedDuration:   result.duration != null ? Math.round(result.duration) : null,
      parsedOvertime:   result.overtime                            ?? null,
      parsedData:       result.rawJson ?? Prisma.JsonNull,
      scoresAccepted:   true,
    },
  })

  await prisma.match.update({
    where: { id: upload.matchId },
    data:  { replaysVerified: { increment: 1 } },
  })

  await checkFastPath(upload.matchId)
}

/**
 * Re-triggers parsing for a FAILED replay slot (staff action).
 */
export async function retriggerParse(
  replayUploadId: string,
  staffId: string
): Promise<void> {
  const upload = await prisma.replayUpload.findUnique({
    where: { id: replayUploadId },
    select: { id: true, matchId: true, parseStatus: true },
  })
  if (!upload) throw new Error("Replay upload not found")
  if (upload.parseStatus !== "FAILED") {
    throw new Error(`Only FAILED replays can be re-parsed (current: ${upload.parseStatus})`)
  }

  await prisma.$transaction([
    prisma.replayUpload.update({
      where: { id: replayUploadId },
      data: {
        parseStatus:    "PENDING",
        parseError:     null,
        parseStartedAt: null,
        parseCompletedAt: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId:    staffId,
        action:     "REPLAY_REPARSE_TRIGGERED",
        entityType: "ReplayUpload",
        entityId:   replayUploadId,
        after:      { matchId: upload.matchId },
      },
    }),
  ])

  // Fire-and-forget — errors are logged and surfaced via poll/webhook later
  submitToBallchasing(replayUploadId).catch((err) => {
    console.error(`[replay] retrigger submitToBallchasing failed for ${replayUploadId}:`, err)
  })
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
  const upload = await prisma.replayUpload.findUnique({
    where:  { id: replayUploadId },
    select: { matchId: true, gameNumber: true },
  })
  if (!upload) throw new Error(`ReplayUpload ${replayUploadId} not found`)

  await prisma.matchGame.upsert({
    where: { matchId_gameNumber: { matchId: upload.matchId, gameNumber: upload.gameNumber } },
    create: {
      matchId:       upload.matchId,
      gameNumber:    upload.gameNumber,
      homeGoals:     result.homeGoals ?? 0,
      awayGoals:     result.awayGoals ?? 0,
      overtime:      result.overtime ?? false,
      duration:      result.duration != null ? Math.round(result.duration) : null,
      source:        "REPLAY_AUTO",
      replayUploadId,
    },
    update: {
      homeGoals:     result.homeGoals ?? 0,
      awayGoals:     result.awayGoals ?? 0,
      overtime:      result.overtime ?? false,
      duration:      result.duration != null ? Math.round(result.duration) : null,
      source:        "REPLAY_AUTO",
      replayUploadId,
    },
  })
}

/**
 * Creates ReplayPlayerStat rows from parsed player data.
 */
export async function createPlayerStats(
  replayUploadId: string,
  players: ParsedPlayerStat[]
): Promise<void> {
  // Bulk-delete any prior stats for this upload (re-parse scenario)
  await prisma.replayPlayerStat.deleteMany({ where: { replayUploadId } })

  // Try to match each player's epicUsername to a platform Player record
  const usernames = [...new Set(players.map((p) => p.epicUsername))]
  const playerRecords = await prisma.player.findMany({
    where:  { epicUsername: { in: usernames } },
    select: { id: true, epicUsername: true },
  })
  const epicToPlayerId = new Map(playerRecords.map((p) => [p.epicUsername!, p.id]))

  await prisma.replayPlayerStat.createMany({
    data: players.map((p) => ({
      replayUploadId,
      epicUsername:     p.epicUsername,
      playerId:         epicToPlayerId.get(p.epicUsername) ?? null,
      teamSide:         p.teamSide,
      score:            p.score,
      goals:            p.goals,
      assists:          p.assists,
      saves:            p.saves,
      shots:            p.shots,
      demos:            p.demos,
      boostUsed:        p.boostUsed        ?? null,
      avgBoostAmount:   p.avgBoostAmount   ?? null,
      timeSupersonic:   p.timeSupersonic   ?? null,
      distanceTraveled: p.distanceTraveled ?? null,
      timeInAir:        p.timeInAir        ?? null,
      boostCollected:   p.boostCollected   ?? null,
    })),
  })
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
  const match = await prisma.match.findUnique({
    where:  { id: matchId },
    select: {
      status:        true,
      gamesExpected: true,
      homeTeamId:    true,
      awayTeamId:    true,
    },
  })
  if (!match?.gamesExpected) return

  // Only act when the match is in a state that allows advancement
  const eligible = ["IN_PROGRESS", "MATCH_FINISHED"]
  if (!eligible.includes(match.status)) return

  const successReplays = await prisma.replayUpload.findMany({
    where:  { matchId, parseStatus: "SUCCESS" },
    select: { uploadedByTeamId: true },
  })

  if (successReplays.length < match.gamesExpected) return

  const uploadingTeams = new Set(successReplays.map((r) => r.uploadedByTeamId))
  const bothTeams =
    uploadingTeams.has(match.homeTeamId) && uploadingTeams.has(match.awayTeamId)

  const target = bothTeams ? "COMPLETED" : "VERIFYING"

  // Advance through MATCH_FINISHED if still IN_PROGRESS
  if (match.status === "IN_PROGRESS") {
    await prisma.match.update({ where: { id: matchId }, data: { status: "MATCH_FINISHED" } })
  }

  if (target === "COMPLETED") {
    // Tally series scores from MatchGame results
    const games = await prisma.matchGame.findMany({
      where:  { matchId },
      select: { homeGoals: true, awayGoals: true },
    })
    const homeScore = games.filter((g) => g.homeGoals > g.awayGoals).length
    const awayScore = games.filter((g) => g.awayGoals > g.homeGoals).length
    const winnerId  = homeScore > awayScore ? match.homeTeamId : match.awayTeamId

    await prisma.match.update({
      where: { id: matchId },
      data:  { status: "COMPLETED", completedAt: new Date(), homeScore, awayScore, winnerId },
    })

    await applyMatchToStandings(matchId)
  } else {
    // Still write series scores so the display is correct while awaiting confirmation
    const games = await prisma.matchGame.findMany({
      where:  { matchId },
      select: { homeGoals: true, awayGoals: true },
    })
    const homeScore = games.filter((g) => g.homeGoals > g.awayGoals).length
    const awayScore = games.filter((g) => g.awayGoals > g.homeGoals).length
    const winnerId  = homeScore > awayScore ? match.homeTeamId : match.awayTeamId

    await prisma.match.update({
      where: { id: matchId },
      data:  { status: "VERIFYING", homeScore, awayScore, winnerId },
    })
  }
}

// ---------------------------------------------------------------------------
// Polling (cron fallback)
// ---------------------------------------------------------------------------

/**
 * Polls ballchasing.com for the status of all PROCESSING replays.
 * Fallback for when webhooks are not delivered.
 *
 * For each PROCESSING upload:
 *  - If stale (parseStartedAt older than REPLAY_STALE_AFTER_MS): mark FAILED
 *  - Otherwise: fetch status from ballchasing.com
 *    - "pending" → still working, skip
 *    - "ok"      → parse SUCCESS, hand off to handleParseResult
 *    - "failed"  → mark FAILED, hand off to handleParseResult
 *
 * @returns Number of uploads whose status changed this tick.
 */
/** How long a PENDING upload is allowed to sit before we retry submitting it to ballchasing. */
const PENDING_RETRY_AFTER_MS = 60_000 // 1 minute

export async function pollProcessingReplays(): Promise<number> {
  const { getReplayStatus, toParseResult } = await import("@/lib/services/ballchasing.service")
  const { REPLAY_STALE_AFTER_MS } = await import("@/lib/constants")

  let processed = 0

  // ── 1. Retry stale PENDING uploads ─────────────────────────────────────────
  //
  // submitToBallchasing is fire-and-forget inside createReplayUpload. If it
  // fails (network error, cold-start timeout, serverless termination), the row
  // stays PENDING indefinitely because nothing watches for it.
  // Any PENDING row older than PENDING_RETRY_AFTER_MS gets a fresh attempt.
  const retryThreshold = new Date(Date.now() - PENDING_RETRY_AFTER_MS)
  const stalePending = await prisma.replayUpload.findMany({
    where:  { parseStatus: "PENDING", createdAt: { lt: retryThreshold } },
    select: { id: true },
  })

  for (const upload of stalePending) {
    try {
      await submitToBallchasing(upload.id)
      processed++
    } catch (err) {
      console.error(`[pollProcessingReplays] retry PENDING upload ${upload.id}:`, err)
    }
  }

  // ── 2. Poll PROCESSING uploads for results ──────────────────────────────────
  const processing = await prisma.replayUpload.findMany({
    where:  { parseStatus: "PROCESSING" },
    select: {
      id:             true,
      ballchasingId:  true,
      parseStartedAt: true,
      homeTeamColor:  true,
    },
  })

  const staleThreshold = new Date(Date.now() - REPLAY_STALE_AFTER_MS)

  for (const upload of processing) {
    try {
      // Stale without a response — fail it
      if (upload.parseStartedAt && upload.parseStartedAt < staleThreshold) {
        await handleParseResult(upload.id, {
          status:       "FAILED",
          errorMessage: "Parse timed out: no response from ballchasing.com within the expected window",
        })
        processed++
        continue
      }

      // No ballchasingId means the upload to ballchasing never completed
      if (!upload.ballchasingId) continue

      const replay = await getReplayStatus(upload.ballchasingId)

      // Still pending on their end — nothing to do yet
      if (replay.status === "pending") continue

      const homeTeamColor = upload.homeTeamColor === "orange" ? "orange" : "blue"
      const result = toParseResult(replay, homeTeamColor)
      await handleParseResult(upload.id, result)
      processed++
    } catch (err) {
      // Log and continue — a single upload failure must not abort the rest
      console.error(`[pollProcessingReplays] upload ${upload.id} failed:`, err)
    }

    // Respect ballchasing.com rate limits between requests
    await new Promise((r) => setTimeout(r, 500))
  }

  return processed
}
