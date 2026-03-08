/**
 * checkin.service.ts
 *
 * Check-in lifecycle for matches.
 *
 * Flow:
 *  1. Cron calls openCheckIn() when match.checkInOpenAt is reached
 *     → SCHEDULED → CHECKING_IN; two MatchCheckIn rows created (PENDING)
 *  2. Team manager calls checkIn() from the dashboard
 *     → MatchCheckIn.status = CHECKED_IN
 *     → If both teams now CHECKED_IN: → IN_PROGRESS
 *  3. Cron calls resolveCheckInDeadline() when checkInDeadlineAt is reached
 *     → One missed → FORFEITED (missedTeam gets forfeitLoss)
 *     → Both missed → NO_SHOW
 *  4. Staff may call forceCheckIn() to override for a specific team
 */

import { prisma } from "@/lib/prisma"
import type { MatchCheckIn } from "@prisma/client"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Opens the check-in window for a match.
 * Called by the cron job when match.checkInOpenAt is reached.
 * Transitions: SCHEDULED → CHECKING_IN
 * Creates two MatchCheckIn rows (one per team) with status=PENDING.
 */
export async function openCheckIn(matchId: string): Promise<void> {
  // TODO:
  // 1. Fetch match; guard: status must be SCHEDULED
  // 2. Use transitionTo(matchId, "CHECKING_IN", "system")
  // 3. Upsert MatchCheckIn rows for homeTeamId and awayTeamId
  throw new Error("Not implemented: openCheckIn")
}

/**
 * Records a team check-in by a team manager.
 * If both teams are now checked in, transitions the match to IN_PROGRESS.
 *
 * @returns The updated MatchCheckIn record for the team.
 */
export async function checkIn(
  matchId: string,
  teamId: string,
  userId: string
): Promise<MatchCheckIn> {
  // TODO:
  // 1. Fetch match; guard: status must be CHECKING_IN
  // 2. Validate teamId is homeTeamId or awayTeamId
  // 3. Update MatchCheckIn: status=CHECKED_IN, checkedInAt=now(), checkedInBy=userId
  // 4. If both MatchCheckIn rows are now CHECKED_IN:
  //    transitionTo(matchId, "IN_PROGRESS", userId)
  //    Set match.gamesExpected = gamesExpectedForFormat(match.format)
  // 5. Return the updated MatchCheckIn
  throw new Error("Not implemented: checkIn")
}

/**
 * Staff override: force a team into CHECKED_IN state.
 * Also triggers IN_PROGRESS if the other team was already checked in.
 */
export async function forceCheckIn(
  matchId: string,
  teamId: string,
  staffId: string
): Promise<void> {
  // TODO:
  // 1. Fetch match; guard: status must be CHECKING_IN
  // 2. Update MatchCheckIn: status=CHECKED_IN, checkedInBy=staffId
  // 3. Check if both sides now CHECKED_IN → transitionTo IN_PROGRESS
  // 4. Write AuditLog: action="MATCH_CHECKIN_FORCED"
  throw new Error("Not implemented: forceCheckIn")
}

/**
 * Resolves check-in outcome when the deadline is reached.
 * Called by the cron job when match.checkInDeadlineAt is reached.
 *
 *  - Both CHECKED_IN  → already IN_PROGRESS, no-op
 *  - One missed       → FORFEITED (missed team gets forfeit loss)
 *  - Both missed      → NO_SHOW
 */
export async function resolveCheckInDeadline(matchId: string): Promise<void> {
  // TODO:
  // 1. Fetch match + both MatchCheckIn rows
  // 2. Guard: only act if status is CHECKING_IN
  // 3. Count how many teams have status=MISSED (i.e., still PENDING at deadline)
  // 4. Mark overdue MatchCheckIn rows as MISSED
  // 5. transitionTo FORFEITED or NO_SHOW accordingly
  // 6. If FORFEITED: call applyMatchToStandings() with forfeit rules
  throw new Error("Not implemented: resolveCheckInDeadline")
}

/**
 * Batch processor for the cron job.
 * Finds all CHECKING_IN matches whose checkInDeadlineAt has passed
 * and calls resolveCheckInDeadline() for each.
 */
export async function processOverdueCheckIns(): Promise<void> {
  // TODO:
  // 1. Query: matches WHERE status=CHECKING_IN AND checkInDeadlineAt <= now()
  // 2. For each: resolveCheckInDeadline(match.id)
  throw new Error("Not implemented: processOverdueCheckIns")
}

/**
 * Batch processor for the cron job.
 * Finds all SCHEDULED matches whose checkInOpenAt has passed
 * and calls openCheckIn() for each.
 */
export async function processScheduledMatchesForCheckIn(): Promise<void> {
  // TODO:
  // 1. Query: matches WHERE status=SCHEDULED AND checkInOpenAt <= now()
  // 2. For each: openCheckIn(match.id)
  throw new Error("Not implemented: processScheduledMatchesForCheckIn")
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Returns both MatchCheckIn rows for a match with their current status.
 */
export async function getCheckInStatus(
  matchId: string
): Promise<{ home: MatchCheckIn | null; away: MatchCheckIn | null }> {
  // TODO:
  // 1. Fetch match.homeTeamId, match.awayTeamId
  // 2. Fetch both MatchCheckIn rows
  throw new Error("Not implemented: getCheckInStatus")
}
