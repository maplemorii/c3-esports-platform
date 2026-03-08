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

/** Default multi-key sort used by the standings service and table UI. */
export const DEFAULT_STANDINGS_SORT: StandingsSortConfig[] = [
  { field: "points",           direction: "desc" },
  { field: "gameDifferential", direction: "desc" },
  { field: "goalDifferential", direction: "desc" },
  { field: "wins",             direction: "desc" },
]

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
