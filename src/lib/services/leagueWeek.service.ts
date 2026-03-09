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
import type { LeagueWeek, MatchStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TERMINAL_STATUSES: MatchStatus[] = [
  "COMPLETED", "FORFEITED", "NO_SHOW", "CANCELLED",
]

const MS_PER_DAY = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Auto-generates LeagueWeek rows for a season based on season.leagueWeeks
 * and season.startDate.
 *
 * Week N:
 *   startDate = season.startDate + (N-1) × 7 days
 *   endDate   = startDate + 6 days, 23:59:59.999 UTC
 *
 * Idempotent — upserts by (seasonId, weekNumber), so existing weeks are not
 * overwritten. Only newly created weeks are returned.
 *
 * @returns All LeagueWeek records for the season (existing + created).
 */
export async function generateWeeks(seasonId: string): Promise<LeagueWeek[]> {
  const season = await prisma.season.findUnique({
    where:  { id: seasonId },
    select: { id: true, startDate: true, leagueWeeks: true },
  })
  if (!season) throw new Error(`Season ${seasonId} not found`)
  if (!season.startDate) {
    throw new Error(
      `Season ${seasonId} has no startDate — set it before generating weeks`
    )
  }

  const base = season.startDate.getTime()

  for (let i = 1; i <= season.leagueWeeks; i++) {
    const weekStart = new Date(base + (i - 1) * 7 * MS_PER_DAY)
    // End of week: startDate + 6 days, end of day UTC
    const weekEnd = new Date(
      weekStart.getTime() + 6 * MS_PER_DAY + 23 * 3600_000 + 59 * 60_000 + 59_999
    )

    await prisma.leagueWeek.upsert({
      where:  { seasonId_weekNumber: { seasonId, weekNumber: i } },
      update: {}, // never overwrite existing weeks (staff may have adjusted dates)
      create: {
        seasonId,
        weekNumber: i,
        startDate:  weekStart,
        endDate:    weekEnd,
      },
    })
  }

  // Return all weeks for the season
  return prisma.leagueWeek.findMany({
    where:   { seasonId },
    orderBy: { weekNumber: "asc" },
  })
}

/**
 * Checks whether every match in a week has reached a terminal status
 * (COMPLETED, FORFEITED, NO_SHOW, or CANCELLED).
 * If so, marks the week as complete.
 *
 * Called after each match completes.
 *
 * @returns true if the week was just marked complete, false otherwise.
 */
export async function checkWeekCompletion(weekId: string): Promise<boolean> {
  const matches = await prisma.match.findMany({
    where:  { leagueWeekId: weekId, deletedAt: null },
    select: { status: true },
  })

  // A week with no matches is not complete
  if (matches.length === 0) return false

  const allTerminal = matches.every((m) => TERMINAL_STATUSES.includes(m.status))
  if (!allTerminal) return false

  await prisma.leagueWeek.update({
    where: { id: weekId },
    data:  { isComplete: true },
  })
  return true
}

/**
 * Manually marks a week as complete (staff action).
 * Writes an AuditLog entry.
 */
export async function markWeekComplete(weekId: string, staffId: string): Promise<void> {
  await prisma.$transaction([
    prisma.leagueWeek.update({
      where: { id: weekId },
      data:  { isComplete: true },
    }),
    prisma.auditLog.create({
      data: {
        actorId:    staffId,
        action:     "LEAGUE_WEEK_MARKED_COMPLETE",
        entityType: "LeagueWeek",
        entityId:   weekId,
      },
    }),
  ])
}

/**
 * Updates a week's date range and writes an AuditLog entry.
 * Does NOT recalculate match timestamps — that is handled by the caller
 * if needed (match rescheduling is a separate staff operation).
 */
export async function adjustWeekDates(
  weekId:    string,
  startDate: Date,
  endDate:   Date,
  staffId:   string
): Promise<LeagueWeek> {
  if (startDate >= endDate) {
    throw new Error("startDate must be before endDate")
  }

  const existing = await prisma.leagueWeek.findUnique({
    where:  { id: weekId },
    select: { id: true, startDate: true, endDate: true },
  })
  if (!existing) throw new Error(`LeagueWeek ${weekId} not found`)

  const [updated] = await prisma.$transaction([
    prisma.leagueWeek.update({
      where: { id: weekId },
      data:  { startDate, endDate },
    }),
    prisma.auditLog.create({
      data: {
        actorId:    staffId,
        action:     "LEAGUE_WEEK_DATES_ADJUSTED",
        entityType: "LeagueWeek",
        entityId:   weekId,
        before:     { startDate: existing.startDate, endDate: existing.endDate },
        after:      { startDate, endDate },
      },
    }),
  ])

  return updated
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
    where:   { seasonId },
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
        where:   { deletedAt: null },
        include: {
          homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
          awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
  })
}
