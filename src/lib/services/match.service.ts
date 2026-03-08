/**
 * match.service.ts
 *
 * Match lifecycle: creation, scheduling, rescheduling, and cancellation.
 * Owns the logic for deriving timing timestamps from a scheduledAt value
 * and the season's configuration.
 *
 * Status transitions live in matchStatus.service.ts.
 * Check-in logic lives in checkin.service.ts.
 */

import { prisma } from "@/lib/prisma"
import type { Match, MatchFormat, MatchType } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateMatchInput {
  divisionId: string
  leagueWeekId?: string
  homeTeamId: string
  awayTeamId: string
  format?: MatchFormat
  matchType?: MatchType
  scheduledAt?: Date
  notes?: string
}

export interface ScheduleMatchInput {
  scheduledAt: Date
}

export interface DerivedTimestamps {
  checkInOpenAt: Date
  checkInDeadlineAt: Date
  resultDeadlineAt: Date
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a new match and persists derived timing timestamps if scheduledAt
 * is provided. Returns the created match.
 */
export async function createMatch(input: CreateMatchInput): Promise<Match> {
  // TODO:
  // 1. Validate homeTeamId !== awayTeamId
  // 2. Validate both teams are approved in the division
  // 3. If scheduledAt provided, derive timing timestamps via deriveTimestamps()
  // 4. Determine gamesExpected from format (BO3=3, BO5=5, BO7=7, BO1=1)
  // 5. prisma.match.create(...)
  throw new Error("Not implemented: createMatch")
}

/**
 * Updates a match's scheduledAt and recalculates all derived timestamps.
 * Resets check-in state if the match has not yet reached IN_PROGRESS.
 */
export async function rescheduleMatch(
  matchId: string,
  input: ScheduleMatchInput,
  staffId: string
): Promise<Match> {
  // TODO:
  // 1. Fetch match + division.season for timing config
  // 2. Guard: cannot reschedule COMPLETED / FORFEITED matches
  // 3. Recalculate timestamps via deriveTimestamps()
  // 4. If match is CHECKING_IN, reset MatchCheckIn rows to PENDING
  // 5. Update match + write AuditLog entry
  throw new Error("Not implemented: rescheduleMatch")
}

/**
 * Soft-cancels a match by setting status → CANCELLED.
 * Does not affect standings.
 */
export async function cancelMatch(
  matchId: string,
  reason: string,
  staffId: string
): Promise<Match> {
  // TODO:
  // 1. Guard: cannot cancel an already-COMPLETED match without override
  // 2. prisma.match.update({ status: "CANCELLED", notes: reason })
  // 3. Write AuditLog entry: action="MATCH_CANCELLED"
  throw new Error("Not implemented: cancelMatch")
}

/**
 * Returns the number of games expected for a given format.
 * e.g. BO3 → 3 (max possible games), BO1 → 1
 */
export function gamesExpectedForFormat(format: MatchFormat): number {
  const map: Record<MatchFormat, number> = { BO1: 1, BO3: 3, BO5: 5, BO7: 7 }
  return map[format]
}

// ---------------------------------------------------------------------------
// Timestamp derivation
// ---------------------------------------------------------------------------

interface SeasonTimingConfig {
  checkInWindowMinutes: number   // minutes before scheduledAt that check-in opens
  checkInGraceMinutes: number    // minutes after scheduledAt before forfeit
  resultWindowHours: number      // hours after scheduledAt to submit scores
}

/**
 * Derives the three timing timestamps from a scheduledAt date and the
 * season's configuration. Pure function — no side effects.
 */
export function deriveTimestamps(
  scheduledAt: Date,
  config: SeasonTimingConfig
): DerivedTimestamps {
  const ms = scheduledAt.getTime()
  return {
    checkInOpenAt:     new Date(ms - config.checkInWindowMinutes * 60_000),
    checkInDeadlineAt: new Date(ms + config.checkInGraceMinutes  * 60_000),
    resultDeadlineAt:  new Date(ms + config.resultWindowHours    * 3_600_000),
  }
}

/**
 * Fetches a match's season timing config from the DB.
 */
export async function getTimingConfig(matchId: string): Promise<SeasonTimingConfig> {
  // TODO:
  // 1. Fetch match.division.season with timing fields
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: {
      division: {
        select: {
          season: {
            select: {
              checkInWindowMinutes: true,
              checkInGraceMinutes: true,
              resultWindowHours: true,
            },
          },
        },
      },
    },
  })
  return match.division.season
}
