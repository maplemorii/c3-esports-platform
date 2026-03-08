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
import type { Match, Division } from "@prisma/client"

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
 *
 * Use this after a bulk import, a season reset, or a disputed result override.
 */
export async function recalculateStandings(divisionId: string): Promise<void> {
  // TODO:
  // 1. Fetch all COMPLETED + FORFEITED matches for divisionId
  // 2. Zero out all StandingEntry rows for the division
  // 3. Iterate matches → applyMatchToStandings() for each
  // 4. Persist updated entries in a single transaction
  throw new Error("Not implemented: recalculateStandings")
}

/**
 * Incremental update — applies one newly-completed match to standings.
 * Much cheaper than a full recalculation; used on the hot path after
 * each match completes.
 */
export async function applyMatchToStandings(matchId: string): Promise<void> {
  // TODO:
  // 1. Fetch match with homeTeamId, awayTeamId, homeScore, awayScore, status
  // 2. Fetch season.pointsConfig via match.division.season
  // 3. Determine winner/loser (or forfeit)
  // 4. Upsert StandingEntry for both teams with incremental deltas
  // 5. Recalculate gameDifferential, goalDifferential, winPct, streak
  // 6. Set lastUpdated = now()
  throw new Error("Not implemented: applyMatchToStandings")
}

/**
 * Reverses a previously applied match's contribution to standings.
 * Must be called BEFORE applying a corrected result on staff overrides.
 */
export async function reverseMatchFromStandings(matchId: string): Promise<void> {
  // TODO:
  // 1. Fetch the original match result (homeScore, awayScore, status)
  // 2. Apply the inverse delta to both teams' StandingEntry rows
  // 3. Recalculate derived fields
  throw new Error("Not implemented: reverseMatchFromStandings")
}

/**
 * Ensures a StandingEntry row exists for every approved team in a division.
 * Called when a team registration is approved, or when a division is created.
 */
export async function ensureStandingEntries(divisionId: string): Promise<void> {
  // TODO:
  // 1. Fetch all APPROVED SeasonRegistration rows for divisionId
  // 2. Upsert a zeroed StandingEntry for any team that doesn't have one
  throw new Error("Not implemented: ensureStandingEntries")
}

/**
 * Applies a manual admin override to a single team's standing entry.
 */
export async function applyManualOverride(
  entryId: string,
  delta: Partial<StandingsDelta>,
  staffId: string
): Promise<void> {
  // TODO:
  // 1. Update the StandingEntry fields from delta
  // 2. Recalculate derived fields (gameDifferential, winPct, etc.)
  // 3. Write an AuditLog entry: action="STANDINGS_MANUAL_OVERRIDE"
  throw new Error("Not implemented: applyManualOverride")
}

// ---------------------------------------------------------------------------
// Internal helpers (exported for testing)
// ---------------------------------------------------------------------------

/** Parses a season's pointsConfig JSON into a typed object. */
export function parsePointsConfig(raw: unknown): PointsConfig {
  // TODO: validate and parse the JSON from season.pointsConfig
  const defaults: PointsConfig = { win: 3, loss: 0, forfeitWin: 3, forfeitLoss: 0 }
  if (!raw || typeof raw !== "object") return defaults
  return { ...defaults, ...(raw as Partial<PointsConfig>) }
}

/** Returns the win streak delta: +1 on win, -1 on loss, resets to ±1 on streak break. */
export function nextStreak(currentStreak: number, won: boolean): number {
  // TODO: implement streak logic
  // Positive = win streak, negative = loss streak
  if (won) return currentStreak >= 0 ? currentStreak + 1 : 1
  return currentStreak <= 0 ? currentStreak - 1 : -1
}
