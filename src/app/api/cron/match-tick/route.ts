/**
 * GET /api/cron/match-tick
 *
 * Drives the match lifecycle forward — called every minute by Railway cron.
 * Auth: x-cron-secret header must match CRON_SECRET env var.
 *
 * Steps run each tick:
 *  1. SCHEDULED → CHECKING_IN  (when checkInOpenAt is reached)
 *  2. CHECKING_IN → IN_PROGRESS | FORFEITED | NO_SHOW  (when checkInDeadlineAt passes)
 *  3. Poll PROCESSING replays; mark stale ones as FAILED
 *  4. VERIFYING → DISPUTED  (if result deadline passed without confirmation)
 */

import { handleMatchTick } from "@/lib/cron/matchTick"

export const GET = handleMatchTick
