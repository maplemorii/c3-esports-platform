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
  const {
    divisionId,
    leagueWeekId,
    homeTeamId,
    awayTeamId,
    format = "BO3",
    matchType = "REGULAR_SEASON",
    scheduledAt,
    notes,
  } = input

  // Validate both teams are approved in the division
  const [homeReg, awayReg] = await Promise.all([
    prisma.seasonRegistration.findFirst({
      where: { divisionId, teamId: homeTeamId, status: "APPROVED" },
      select: { id: true },
    }),
    prisma.seasonRegistration.findFirst({
      where: { divisionId, teamId: awayTeamId, status: "APPROVED" },
      select: { id: true },
    }),
  ])

  if (!homeReg) throw new Error("Home team is not an approved participant in this division")
  if (!awayReg) throw new Error("Away team is not an approved participant in this division")

  // Get timing config from the division's season
  const division = await prisma.division.findUniqueOrThrow({
    where: { id: divisionId },
    select: {
      season: {
        select: {
          checkInWindowMinutes: true,
          checkInGraceMinutes:  true,
          resultWindowHours:    true,
        },
      },
    },
  })

  const timestamps = scheduledAt
    ? deriveTimestamps(scheduledAt, division.season)
    : null

  return prisma.match.create({
    data: {
      divisionId,
      leagueWeekId:      leagueWeekId ?? null,
      homeTeamId,
      awayTeamId,
      format,
      matchType,
      scheduledAt:       scheduledAt ?? null,
      checkInOpenAt:     timestamps?.checkInOpenAt     ?? null,
      checkInDeadlineAt: timestamps?.checkInDeadlineAt ?? null,
      resultDeadlineAt:  timestamps?.resultDeadlineAt  ?? null,
      gamesExpected:     gamesExpectedForFormat(format),
      notes:             notes ?? null,
    },
  })
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
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: {
      id:     true,
      status: true,
      division: {
        select: {
          season: {
            select: {
              checkInWindowMinutes: true,
              checkInGraceMinutes:  true,
              resultWindowHours:    true,
            },
          },
        },
      },
    },
  })

  const terminal = ["COMPLETED", "FORFEITED", "NO_SHOW", "CANCELLED"]
  if (terminal.includes(match.status)) {
    throw new Error(`Cannot reschedule a match with status ${match.status}`)
  }

  const timestamps = deriveTimestamps(input.scheduledAt, match.division.season)

  // If currently in check-in window, reset the check-in rows
  const resetCheckIn = match.status === "CHECKING_IN"

  const [updated] = await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: {
        scheduledAt:       input.scheduledAt,
        checkInOpenAt:     timestamps.checkInOpenAt,
        checkInDeadlineAt: timestamps.checkInDeadlineAt,
        resultDeadlineAt:  timestamps.resultDeadlineAt,
        // Drop back to SCHEDULED if we were in check-in
        ...(resetCheckIn ? { status: "SCHEDULED" } : {}),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId:    staffId,
        action:     "MATCH_RESCHEDULED",
        entityType: "Match",
        entityId:   matchId,
        after: {
          scheduledAt:       input.scheduledAt.toISOString(),
          checkInOpenAt:     timestamps.checkInOpenAt.toISOString(),
          checkInDeadlineAt: timestamps.checkInDeadlineAt.toISOString(),
          resultDeadlineAt:  timestamps.resultDeadlineAt.toISOString(),
        },
      },
    }),
    ...(resetCheckIn
      ? [
          prisma.matchCheckIn.updateMany({
            where: { matchId },
            data:  { status: "PENDING", checkedInAt: null },
          }),
        ]
      : []),
  ])

  return updated
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
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: { id: true, status: true },
  })

  if (match.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed match. Use a staff result override instead.")
  }
  if (match.status === "CANCELLED") {
    throw new Error("Match is already cancelled.")
  }

  const [updated] = await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: {
        status:    "CANCELLED",
        notes:     reason,
        deletedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId:    staffId,
        action:     "MATCH_CANCELLED",
        entityType: "Match",
        entityId:   matchId,
        after:      { reason },
      },
    }),
  ])

  return updated
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
