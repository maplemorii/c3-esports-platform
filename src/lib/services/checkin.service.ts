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
import { NotFoundError, DomainError } from "@/lib/utils/errors"
import { transitionTo } from "@/lib/services/matchStatus.service"
import { gamesExpectedForFormat } from "@/lib/services/match.service"
import { applyMatchToStandings } from "@/lib/services/standings.service"
import { sendBotWebhook } from "@/lib/bot-webhook"

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
  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: {
      status:            true,
      homeTeamId:        true,
      awayTeamId:        true,
      scheduledAt:       true,
      checkInDeadlineAt: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  })
  if (!match) throw new NotFoundError("Match", matchId)
  if (match.status !== "SCHEDULED") throw new DomainError("Match is not in SCHEDULED state")

  await transitionTo(matchId, "CHECKING_IN", "system")

  await prisma.matchCheckIn.createMany({
    data: [
      { matchId, teamId: match.homeTeamId },
      { matchId, teamId: match.awayTeamId },
    ],
    skipDuplicates: true,
  })

  sendBotWebhook("match.checkin_opened", {
    matchId,
    homeTeamId:        match.homeTeamId,
    homeTeam:          match.homeTeam.name,
    awayTeamId:        match.awayTeamId,
    awayTeam:          match.awayTeam.name,
    scheduledAt:       match.scheduledAt?.toISOString() ?? null,
    checkInDeadlineAt: match.checkInDeadlineAt?.toISOString() ?? null,
  })
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
  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: {
      status: true, homeTeamId: true, awayTeamId: true, format: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  })
  if (!match) throw new NotFoundError("Match", matchId)
  if (match.status !== "CHECKING_IN") throw new DomainError("Match is not currently in check-in phase")
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new DomainError("Team is not part of this match")
  }

  const record = await prisma.matchCheckIn.update({
    where: { matchId_teamId: { matchId, teamId } },
    data:  { status: "CHECKED_IN", checkedInAt: new Date(), checkedInBy: userId },
  })

  const all = await prisma.matchCheckIn.findMany({
    where:  { matchId },
    select: { status: true },
  })
  if (all.length === 2 && all.every((c) => c.status === "CHECKED_IN")) {
    await prisma.match.update({
      where: { id: matchId },
      data:  { gamesExpected: gamesExpectedForFormat(match.format) },
    })
    await transitionTo(matchId, "IN_PROGRESS", userId)
    sendBotWebhook("match.started", {
      matchId,
      homeTeamId: match.homeTeamId,
      homeTeam:   match.homeTeam.name,
      awayTeamId: match.awayTeamId,
      awayTeam:   match.awayTeam.name,
      format:     match.format,
    })
  }

  return record
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
  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: {
      status: true, homeTeamId: true, awayTeamId: true, format: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  })
  if (!match) throw new NotFoundError("Match", matchId)
  if (match.status !== "CHECKING_IN") throw new DomainError("Match is not currently in check-in phase")
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new DomainError("Team is not part of this match")
  }

  await prisma.matchCheckIn.update({
    where: { matchId_teamId: { matchId, teamId } },
    data:  { status: "CHECKED_IN", checkedInAt: new Date(), checkedInBy: staffId },
  })

  const all = await prisma.matchCheckIn.findMany({
    where:  { matchId },
    select: { status: true },
  })
  if (all.length === 2 && all.every((c) => c.status === "CHECKED_IN")) {
    await prisma.match.update({
      where: { id: matchId },
      data:  { gamesExpected: gamesExpectedForFormat(match.format) },
    })
    await transitionTo(matchId, "IN_PROGRESS", staffId)
    sendBotWebhook("match.started", {
      matchId,
      homeTeamId: match.homeTeamId,
      homeTeam:   match.homeTeam.name,
      awayTeamId: match.awayTeamId,
      awayTeam:   match.awayTeam.name,
      format:     match.format,
    })
  }

  await prisma.auditLog.create({
    data: {
      actorId:    staffId,
      action:     "MATCH_CHECKIN_FORCED",
      entityType: "Match",
      entityId:   matchId,
      after:      { teamId },
    },
  })
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
  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: {
      status:   true,
      checkIns: { select: { teamId: true, status: true } },
    },
  })
  if (!match) throw new NotFoundError("Match", matchId)
  if (match.status !== "CHECKING_IN") return // already resolved

  const pending = match.checkIns.filter((c) => c.status === "PENDING")
  if (pending.length === 0) return // both already CHECKED_IN → IN_PROGRESS, no-op

  await prisma.matchCheckIn.updateMany({
    where: { matchId, status: "PENDING" },
    data:  { status: "MISSED" },
  })

  if (pending.length >= 2) {
    await transitionTo(matchId, "NO_SHOW", "system")
  } else {
    await transitionTo(matchId, "FORFEITED", "system")
    await applyMatchToStandings(matchId)
  }
}

/**
 * Batch processor for the cron job.
 * Finds all CHECKING_IN matches whose checkInDeadlineAt has passed
 * and calls resolveCheckInDeadline() for each.
 */
export async function processOverdueCheckIns(): Promise<number> {
  const matches = await prisma.match.findMany({
    where:  { status: "CHECKING_IN", checkInDeadlineAt: { lte: new Date() }, deletedAt: null },
    select: { id: true },
  })
  let count = 0
  for (const { id } of matches) {
    try {
      await resolveCheckInDeadline(id)
      count++
    } catch (err) {
      console.error(`[processOverdueCheckIns] Failed for match ${id}:`, err)
    }
  }
  return count
}

/**
 * Batch processor for the cron job.
 * Finds all SCHEDULED matches whose checkInOpenAt has passed
 * and calls openCheckIn() for each.
 */
export async function processScheduledMatchesForCheckIn(): Promise<number> {
  const matches = await prisma.match.findMany({
    where:  { status: "SCHEDULED", checkInOpenAt: { lte: new Date() }, deletedAt: null },
    select: { id: true },
  })
  let count = 0
  for (const { id } of matches) {
    try {
      await openCheckIn(id)
      count++
    } catch (err) {
      console.error(`[processScheduledMatchesForCheckIn] Failed for match ${id}:`, err)
    }
  }
  return count
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
  const match = await prisma.match.findUnique({
    where:  { id: matchId },
    select: { homeTeamId: true, awayTeamId: true },
  })
  if (!match) throw new NotFoundError("Match", matchId)

  const [home, away] = await Promise.all([
    prisma.matchCheckIn.findUnique({
      where: { matchId_teamId: { matchId, teamId: match.homeTeamId } },
    }),
    prisma.matchCheckIn.findUnique({
      where: { matchId_teamId: { matchId, teamId: match.awayTeamId } },
    }),
  ])

  return { home, away }
}
