/**
 * standings.ts
 *
 * Shared types for the standings system.
 * Used by the standings service, API routes, and client components.
 */

import type { DivisionTier } from "@prisma/client"
import type { TeamSummary } from "./api"

// ---------------------------------------------------------------------------
// Row-level standing data
// ---------------------------------------------------------------------------

/** A single team's head-to-head record against one opponent. */
export interface H2HRecord {
  opponentId: string
  wins:       number
  losses:     number
  gamesWon:   number
  gamesLost:  number
  points:     number
}

/**
 * A single team's standing within a division.
 * Mirrors StandingEntry + joined team info.
 */
export interface StandingsRow {
  id:               string
  rank:             number   // 1-based rank within the division (computed on read)
  teamId:           string
  team:             TeamSummary

  // Match record
  wins:             number
  losses:           number
  matchesPlayed:    number
  forfeitWins:      number
  forfeitLosses:    number

  // Game aggregates
  gamesWon:         number
  gamesLost:        number
  gameDifferential: number
  goalsFor:         number
  goalsAgainst:     number
  goalDifferential: number

  // Computed
  points:           number
  winPct:           number  // 0.0 – 1.0
  streak:           number  // positive = win streak, negative = loss streak

  // Head-to-head records vs each opponent in this division
  h2h:              H2HRecord[]

  lastUpdated:      string
}

// ---------------------------------------------------------------------------
// Division standings
// ---------------------------------------------------------------------------

/** All standings rows for one division. */
export interface DivisionStandings {
  divisionId:  string
  divisionName:string
  tier:        DivisionTier
  rows:        StandingsRow[]
}

// ---------------------------------------------------------------------------
// Season standings
// ---------------------------------------------------------------------------

/** Standings for all divisions in a season, keyed by division tier. */
export interface SeasonStandings {
  seasonId:   string
  seasonName: string
  divisions:  DivisionStandings[]
}

// ---------------------------------------------------------------------------
// Standings sort options
// ---------------------------------------------------------------------------

export type StandingsSortField =
  | "points"
  | "wins"
  | "losses"
  | "gameDifferential"
  | "goalDifferential"
  | "winPct"
  | "matchesPlayed"

export type SortDirection = "asc" | "desc"

export interface StandingsSortConfig {
  field:     StandingsSortField
  direction: SortDirection
}

/** Default multi-key sort used for DB orderBy (no H2H). */
export const DEFAULT_STANDINGS_SORT: StandingsSortConfig[] = [
  { field: "points",           direction: "desc" },
  { field: "gameDifferential", direction: "desc" },
  { field: "goalDifferential", direction: "desc" },
  { field: "wins",             direction: "desc" },
]

// ---------------------------------------------------------------------------
// H2H-aware sort (applied in JS after fetching standings with h2h data)
// Tiebreaker order:
//   1. Points
//   2. H2H points among tied teams
//   3. H2H game differential among tied teams
//   4. Overall game differential
//   5. Overall goal differential
//   6. Wins
// ---------------------------------------------------------------------------

function h2hPointsAgainst(row: StandingsRow, opponentIds: Set<string>): number {
  return row.h2h
    .filter((r) => opponentIds.has(r.opponentId))
    .reduce((sum, r) => sum + r.points, 0)
}

function h2hGameDiffAgainst(row: StandingsRow, opponentIds: Set<string>): number {
  return row.h2h
    .filter((r) => opponentIds.has(r.opponentId))
    .reduce((sum, r) => sum + (r.gamesWon - r.gamesLost), 0)
}

/**
 * Sorts standings rows with full H2H tiebreaking.
 * Returns a new sorted array; does not mutate the input.
 */
export function sortStandingsWithH2H(rows: StandingsRow[]): StandingsRow[] {
  // Group rows by points so we can apply H2H only among tied teams
  const grouped = new Map<number, StandingsRow[]>()
  for (const row of rows) {
    const bucket = grouped.get(row.points) ?? []
    bucket.push(row)
    grouped.set(row.points, bucket)
  }

  const sorted: StandingsRow[] = []
  for (const [, group] of [...grouped.entries()].sort(([a], [b]) => b - a)) {
    if (group.length === 1) {
      sorted.push(group[0])
      continue
    }
    const tiedIds = new Set(group.map((r) => r.teamId))
    group.sort((a, b) => {
      const h2hPts = h2hPointsAgainst(b, tiedIds) - h2hPointsAgainst(a, tiedIds)
      if (h2hPts !== 0) return h2hPts

      const h2hGD = h2hGameDiffAgainst(b, tiedIds) - h2hGameDiffAgainst(a, tiedIds)
      if (h2hGD !== 0) return h2hGD

      const gd = b.gameDifferential - a.gameDifferential
      if (gd !== 0) return gd

      const gld = b.goalDifferential - a.goalDifferential
      if (gld !== 0) return gld

      return b.wins - a.wins
    })
    sorted.push(...group)
  }
  return sorted
}

// ---------------------------------------------------------------------------
// Manual override input
// ---------------------------------------------------------------------------

export interface StandingsOverrideDelta {
  wins?:             number
  losses?:           number
  points?:           number
  gamesWon?:         number
  gamesLost?:        number
  goalsFor?:         number
  goalsAgainst?:     number
}
