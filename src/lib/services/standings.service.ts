/**
 * standings.service.ts
 *
 * Recalculates and updates StandingEntry rows for a division.
 *
 * Called after:
 *  - A match transitions to COMPLETED
 *  - A match transitions to FORFEITED / NO_SHOW
 *  - A staff result override is applied (reverse old, apply new)
 *  - A manual standings override is submitted via the admin panel
 */

import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PointsConfig {
  win: number
  loss: number
  forfeitWin: number
  forfeitLoss: number
}

export interface StandingsDelta {
  teamId: string
  wins?: number
  losses?: number
  gamesWon?: number
  gamesLost?: number
  goalsFor?: number
  goalsAgainst?: number
  forfeitWins?: number
  forfeitLosses?: number
  points?: number
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Full recalculation for a division — replays every COMPLETED/FORFEITED match
 * from scratch and overwrites all StandingEntry rows.
 */
export async function recalculateStandings(divisionId: string): Promise<void> {
  // Zero out all entries
  await prisma.standingEntry.updateMany({
    where: { divisionId },
    data: {
      wins: 0, losses: 0, matchesPlayed: 0,
      forfeitWins: 0, forfeitLosses: 0,
      gamesWon: 0, gamesLost: 0, gameDifferential: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifferential: 0,
      points: 0, streak: 0, winPct: 0,
    },
  })

  const matches = await prisma.match.findMany({
    where: { divisionId, status: { in: ["COMPLETED", "FORFEITED", "NO_SHOW"] } },
    select: { id: true },
  })

  for (const match of matches) {
    await applyMatchToStandings(match.id)
  }
}

/**
 * Incremental update — applies one newly-completed match to standings.
 */
export async function applyMatchToStandings(matchId: string): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: {
      divisionId: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winnerId: true,
      status: true,
      division: {
        select: {
          season: { select: { pointsConfig: true } },
        },
      },
    },
  })

  const cfg = parsePointsConfig(match.division.season.pointsConfig)
  const { divisionId, homeTeamId, awayTeamId, status } = match

  if (status === "NO_SHOW") {
    // Both teams get a forfeit loss
    await applyDelta(divisionId, homeTeamId, { forfeitLoss: 1, loss: 1, points: cfg.forfeitLoss })
    await applyDelta(divisionId, awayTeamId, { forfeitLoss: 1, loss: 1, points: cfg.forfeitLoss })
    return
  }

  if (status === "FORFEITED") {
    const winnerId = match.winnerId
    const loserId = winnerId === homeTeamId ? awayTeamId : homeTeamId
    await applyDelta(divisionId, winnerId!, { forfeitWin: 1, win: 1, points: cfg.forfeitWin })
    await applyDelta(divisionId, loserId, { forfeitLoss: 1, loss: 1, points: cfg.forfeitLoss })
    return
  }

  // COMPLETED
  const homeWon = (match.homeScore ?? 0) > (match.awayScore ?? 0)
  const gamesWonHome = match.homeScore ?? 0
  const gamesWonAway = match.awayScore ?? 0

  await applyDelta(divisionId, homeTeamId, {
    win: homeWon ? 1 : 0,
    loss: homeWon ? 0 : 1,
    gamesWon: gamesWonHome,
    gamesLost: gamesWonAway,
    points: homeWon ? cfg.win : cfg.loss,
  })

  await applyDelta(divisionId, awayTeamId, {
    win: homeWon ? 0 : 1,
    loss: homeWon ? 1 : 0,
    gamesWon: gamesWonAway,
    gamesLost: gamesWonHome,
    points: homeWon ? cfg.loss : cfg.win,
  })
}

/**
 * Reverses a previously applied match's contribution to standings.
 */
export async function reverseMatchFromStandings(matchId: string): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: {
      divisionId: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winnerId: true,
      status: true,
      division: {
        select: {
          season: { select: { pointsConfig: true } },
        },
      },
    },
  })

  const cfg = parsePointsConfig(match.division.season.pointsConfig)
  const { divisionId, homeTeamId, awayTeamId, status } = match

  if (status === "NO_SHOW") {
    await applyDelta(divisionId, homeTeamId, { forfeitLoss: -1, loss: -1, points: -cfg.forfeitLoss })
    await applyDelta(divisionId, awayTeamId, { forfeitLoss: -1, loss: -1, points: -cfg.forfeitLoss })
    return
  }

  if (status === "FORFEITED") {
    const winnerId = match.winnerId
    const loserId = winnerId === homeTeamId ? awayTeamId : homeTeamId
    await applyDelta(divisionId, winnerId!, { forfeitWin: -1, win: -1, points: -cfg.forfeitWin })
    await applyDelta(divisionId, loserId, { forfeitLoss: -1, loss: -1, points: -cfg.forfeitLoss })
    return
  }

  // COMPLETED
  const homeWon = (match.homeScore ?? 0) > (match.awayScore ?? 0)
  const gamesWonHome = match.homeScore ?? 0
  const gamesWonAway = match.awayScore ?? 0

  await applyDelta(divisionId, homeTeamId, {
    win: homeWon ? -1 : 0,
    loss: homeWon ? 0 : -1,
    gamesWon: -gamesWonHome,
    gamesLost: -gamesWonAway,
    points: homeWon ? -cfg.win : -cfg.loss,
  })

  await applyDelta(divisionId, awayTeamId, {
    win: homeWon ? 0 : -1,
    loss: homeWon ? -1 : 0,
    gamesWon: -gamesWonAway,
    gamesLost: -gamesWonHome,
    points: homeWon ? -cfg.loss : -cfg.win,
  })
}

/**
 * Ensures a StandingEntry row exists for every approved team in a division.
 */
export async function ensureStandingEntries(divisionId: string): Promise<void> {
  const registrations = await prisma.seasonRegistration.findMany({
    where: { divisionId, status: "APPROVED" },
    select: { teamId: true },
  })

  await Promise.all(
    registrations.map((r) =>
      prisma.standingEntry.upsert({
        where: { divisionId_teamId: { divisionId, teamId: r.teamId } },
        create: { divisionId, teamId: r.teamId },
        update: {},
      })
    )
  )
}

/**
 * Applies a manual admin override to a single team's standing entry.
 */
export async function applyManualOverride(
  entryId: string,
  delta: Partial<StandingsDelta>,
  staffId: string
): Promise<void> {
  const entry = await prisma.standingEntry.findUniqueOrThrow({
    where: { id: entryId },
  })

  const wins = entry.wins + (delta.wins ?? 0)
  const losses = entry.losses + (delta.losses ?? 0)
  const gamesWon = entry.gamesWon + (delta.gamesWon ?? 0)
  const gamesLost = entry.gamesLost + (delta.gamesLost ?? 0)
  const goalsFor = entry.goalsFor + (delta.goalsFor ?? 0)
  const goalsAgainst = entry.goalsAgainst + (delta.goalsAgainst ?? 0)
  const points = entry.points + (delta.points ?? 0)
  const matchesPlayed = wins + losses
  const winPct = matchesPlayed > 0 ? wins / matchesPlayed : 0

  await prisma.$transaction([
    prisma.standingEntry.update({
      where: { id: entryId },
      data: {
        wins, losses, matchesPlayed,
        gamesWon, gamesLost,
        gameDifferential: gamesWon - gamesLost,
        goalsFor, goalsAgainst,
        goalDifferential: goalsFor - goalsAgainst,
        points, winPct,
        lastUpdated: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: staffId,
        action: "STANDINGS_MANUAL_OVERRIDE",
        entityType: "StandingEntry",
        entityId: entryId,
        after: delta,
      },
    }),
  ])
}

// ---------------------------------------------------------------------------
// Internal helpers (exported for testing)
// ---------------------------------------------------------------------------

/** Parses a season's pointsConfig JSON into a typed object. */
export function parsePointsConfig(raw: unknown): PointsConfig {
  const defaults: PointsConfig = { win: 3, loss: 0, forfeitWin: 3, forfeitLoss: 0 }
  if (!raw || typeof raw !== "object") return defaults
  return { ...defaults, ...(raw as Partial<PointsConfig>) }
}

/** Returns the win streak delta: +1 on win, -1 on loss, resets to ±1 on streak break. */
export function nextStreak(currentStreak: number, won: boolean): number {
  if (won) return currentStreak >= 0 ? currentStreak + 1 : 1
  return currentStreak <= 0 ? currentStreak - 1 : -1
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface MatchDelta {
  win?: number
  loss?: number
  gamesWon?: number
  gamesLost?: number
  goalsFor?: number
  goalsAgainst?: number
  forfeitWin?: number
  forfeitLoss?: number
  points?: number
}

async function applyDelta(divisionId: string, teamId: string, d: MatchDelta): Promise<void> {
  const entry = await prisma.standingEntry.upsert({
    where: { divisionId_teamId: { divisionId, teamId } },
    create: { divisionId, teamId },
    update: {},
  })

  const wins = entry.wins + (d.win ?? 0)
  const losses = entry.losses + (d.loss ?? 0)
  const forfeitWins = entry.forfeitWins + (d.forfeitWin ?? 0)
  const forfeitLosses = entry.forfeitLosses + (d.forfeitLoss ?? 0)
  const gamesWon = entry.gamesWon + (d.gamesWon ?? 0)
  const gamesLost = entry.gamesLost + (d.gamesLost ?? 0)
  const goalsFor = entry.goalsFor + (d.goalsFor ?? 0)
  const goalsAgainst = entry.goalsAgainst + (d.goalsAgainst ?? 0)
  const points = entry.points + (d.points ?? 0)
  const matchesPlayed = wins + losses
  const winPct = matchesPlayed > 0 ? wins / matchesPlayed : 0
  const won = (d.win ?? 0) > 0 || (d.forfeitWin ?? 0) > 0
  const lost = (d.loss ?? 0) > 0 || (d.forfeitLoss ?? 0) > 0
  const streak = won
    ? nextStreak(entry.streak, true)
    : lost
      ? nextStreak(entry.streak, false)
      : entry.streak

  await prisma.standingEntry.update({
    where: { id: entry.id },
    data: {
      wins, losses, matchesPlayed,
      forfeitWins, forfeitLosses,
      gamesWon, gamesLost,
      gameDifferential: gamesWon - gamesLost,
      goalsFor, goalsAgainst,
      goalDifferential: goalsFor - goalsAgainst,
      points, winPct, streak,
      lastUpdated: new Date(),
    },
  })
}
