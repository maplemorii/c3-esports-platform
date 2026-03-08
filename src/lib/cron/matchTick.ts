/**
 * matchTick.ts
 *
 * Central cron job that drives the match lifecycle forward.
 * Should be called every minute via a cron endpoint or an external scheduler.
 *
 * Responsibilities (in order):
 *  1. Open check-in for matches whose checkInOpenAt has passed (SCHEDULED → CHECKING_IN)
 *  2. Resolve check-in deadlines (CHECKING_IN → IN_PROGRESS | FORFEITED | NO_SHOW)
 *  3. Poll PROCESSING replays; mark stale ones as FAILED
 *  4. Escalate stale VERIFYING matches → DISPUTED
 *
 * Route handler usage (src/app/api/cron/match-tick/route.ts):
 *   import { handleMatchTick } from "@/lib/cron/matchTick"
 *   export { handleMatchTick as GET }
 *
 * Security:
 *   Caller must send the CRON_SECRET in the `x-cron-secret` header.
 *   Set CRON_SECRET in your environment. For Vercel Cron, use the built-in
 *   CRON_SECRET env var and add `Authorization: Bearer $CRON_SECRET` in vercel.json.
 */

import { NextRequest, NextResponse } from "next/server"
import { processScheduledMatchesForCheckIn, processOverdueCheckIns } from "@/lib/services/checkin.service"
import { pollProcessingReplays } from "@/lib/services/replay.service"
import { escalateStaleVerifyingMatches } from "@/lib/cron/escalateVerifying"
import { CRON_AUTH_HEADER } from "@/lib/constants"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TickResult {
  checkInsOpened:    number
  checkInsResolved:  number
  replaysPolled:     number
  matchesEscalated:  number
  errors:            string[]
}

// ---------------------------------------------------------------------------
// Core tick logic
// ---------------------------------------------------------------------------

/**
 * Runs all time-sensitive match lifecycle steps.
 * Each step is isolated — a failure in one step does not abort the others.
 */
export async function runMatchTick(): Promise<TickResult> {
  const result: TickResult = {
    checkInsOpened:   0,
    checkInsResolved: 0,
    replaysPolled:    0,
    matchesEscalated: 0,
    errors:           [],
  }

  // Step 1: SCHEDULED → CHECKING_IN
  try {
    result.checkInsOpened = await processScheduledMatchesForCheckIn()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[matchTick] processScheduledMatchesForCheckIn failed:", err)
    result.errors.push(`checkInsOpened: ${msg}`)
  }

  // Step 2: CHECKING_IN → IN_PROGRESS | FORFEITED | NO_SHOW
  try {
    result.checkInsResolved = await processOverdueCheckIns()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[matchTick] processOverdueCheckIns failed:", err)
    result.errors.push(`checkInsResolved: ${msg}`)
  }

  // Step 3: Poll PROCESSING replays; fail stale ones
  try {
    result.replaysPolled = await pollProcessingReplays()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[matchTick] pollProcessingReplays failed:", err)
    result.errors.push(`replaysPolled: ${msg}`)
  }

  // Step 4: VERIFYING → DISPUTED (if deadline passed without confirmation)
  try {
    result.matchesEscalated = await escalateStaleVerifyingMatches()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[matchTick] escalateStaleVerifyingMatches failed:", err)
    result.errors.push(`matchesEscalated: ${msg}`)
  }

  return result
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * GET /api/cron/match-tick
 *
 * Authenticated via x-cron-secret header.
 * Returns a JSON summary of what the tick processed.
 */
export async function handleMatchTick(req: NextRequest): Promise<NextResponse> {
  // Authenticate
  const secret = req.headers.get(CRON_AUTH_HEADER)
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const start = Date.now()
  const result = await runMatchTick()
  const durationMs = Date.now() - start

  const hasErrors = result.errors.length > 0
  const status = hasErrors ? 207 : 200

  console.log(`[matchTick] Completed in ${durationMs}ms`, result)

  return NextResponse.json({ ...result, durationMs }, { status })
}
