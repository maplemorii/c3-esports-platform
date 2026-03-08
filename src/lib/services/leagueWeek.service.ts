/**
 * leagueWeek.service.ts
 *
 * League week generation and completion tracking.
 *
 * Called when:
 *  - A season is published (DRAFT → REGISTRATION or ACTIVE): auto-generate weeks
 *  - A match is completed: check whether its week is now fully resolved
 *  - Staff manually adjusts a week's date range
 */

import { prisma } from "@/lib/prisma"
import type { LeagueWeek } from "@prisma/client"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Auto-generates LeagueWeek rows for a season based on season.leagueWeeks,
 * season.startDate, and a configurable start-of-week day.
 *
 * Week N:
 *   startDate = season.startDate + (N-1) * 7 days
 *   endDate   = startDate + 6 days 23:59:59 UTC
 *
 * Idempotent — skips weeks that already exist (by weekNumber).
 *
 * @returns Array of created (or already-existing) LeagueWeek records.
 */
export async function generateWeeks(seasonId: string): Promise<LeagueWeek[]> {
  // TODO:
  // 1. Fetch season: id, startDate, leagueWeeks
  // 2. Guard: season.startDate must be set
  // 3. For i = 1..leagueWeeks:
  //    a. Compute startDate and endDate
  //    b. prisma.leagueWeek.upsert({ where: { seasonId_weekNumber: { seasonId, weekNumber: i } }, ... })
  // 4. Return all weeks for the season
  throw new Error("Not implemented: generateWeeks")
}

/**
 * Checks whether every match in a week has reached a terminal status
 * (COMPLETED, FORFEITED, NO_SHOW, or CANCELLED).
 * If so, marks the week as complete.
 *
 * Called after each match completes.
 */
export async function checkWeekCompletion(weekId: string): Promise<boolean> {
  // TODO:
  // 1. Fetch all matches for weekId
  // 2. Return false if any match is in a non-terminal status
  // 3. If all terminal: prisma.leagueWeek.update({ isComplete: true })
  // 4. Return true
  throw new Error("Not implemented: checkWeekCompletion")
}

/**
 * Manually marks a week as complete (staff action).
 * Writes an AuditLog entry.
 */
export async function markWeekComplete(weekId: string, staffId: string): Promise<void> {
  // TODO:
  // 1. prisma.leagueWeek.update({ isComplete: true })
  // 2. Write AuditLog: action="LEAGUE_WEEK_MARKED_COMPLETE"
  throw new Error("Not implemented: markWeekComplete")
}

/**
 * Updates a week's date range. Recalculates affected match timestamps
 * if any scheduled matches fall within the old or new range.
 */
export async function adjustWeekDates(
  weekId: string,
  startDate: Date,
  endDate: Date,
  staffId: string
): Promise<LeagueWeek> {
  // TODO:
  // 1. Guard: startDate < endDate
  // 2. Update LeagueWeek dates
  // 3. Write AuditLog: action="LEAGUE_WEEK_DATES_ADJUSTED"
  // 4. Return updated week
  throw new Error("Not implemented: adjustWeekDates")
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Returns all weeks for a season with their match counts and completion state.
 */
export async function getWeeksForSeason(seasonId: string): Promise<
  Array<LeagueWeek & { _count: { matches: number } }>
> {
  return prisma.leagueWeek.findMany({
    where: { seasonId },
    include: { _count: { select: { matches: true } } },
    orderBy: { weekNumber: "asc" },
  })
}

/**
 * Returns a week with all its matches, keyed by week number.
 */
export async function getWeekWithMatches(seasonId: string, weekNumber: number) {
  return prisma.leagueWeek.findUnique({
    where: { seasonId_weekNumber: { seasonId, weekNumber } },
    include: {
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
  })
}
