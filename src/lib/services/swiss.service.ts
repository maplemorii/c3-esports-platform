/**
 * swiss.service.ts
 *
 * Swiss tournament pairing algorithm.
 *
 * Swiss format rules for this platform:
 *  - All teams start at 0-0
 *  - Each round, teams are paired with opponents of the same (or closest) record
 *  - Teams cannot be re-paired against opponents they've already faced
 *  - A team is eliminated after reaching the loss threshold (typically 3 losses)
 *  - A team advances after reaching the win threshold (typically 3 wins)
 *  - If an odd number of teams remain, one team receives a bye (automatic win)
 *
 * BracketSlot usage in Swiss:
 *  - Each "slot" represents a team's entry in a round (round=round number, position=pairing index)
 *  - BracketSide is not used for Swiss
 */

import type { BracketSlotNode } from "./bracket.service"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SwissRecord {
  teamId: string
  wins: number
  losses: number
  /** Ordered list of teamIds faced, used to avoid rematches. */
  opponents: string[]
  /** Tiebreaker: cumulative wins of all opponents faced (Buchholz score). */
  buchholz: number
}

export interface SwissPairing {
  team1Id: string
  team2Id: string
  isBye?: false
}

export interface SwissBye {
  teamId: string
  isBye: true
}

export type SwissRoundResult = Array<SwissPairing | SwissBye>

// ---------------------------------------------------------------------------
// Pairing
// ---------------------------------------------------------------------------

/**
 * Generates pairings for a Swiss round.
 *
 * Algorithm (simplified Dutch system):
 *  1. Sort remaining teams by record (wins DESC, buchholz DESC, seed ASC)
 *  2. Group teams by current win count
 *  3. Pair teams within the same group first; if odd in group, drop down
 *  4. Avoid rematches — if top pairing creates a rematch, try next candidate
 *  5. If odd total teams, lowest-ranked team gets a bye
 *
 * @param records    Current Swiss records for all active teams.
 * @param round      The round number being generated (1-based).
 * @returns          Array of pairings (and optional bye).
 */
export function generatePairings(
  records: SwissRecord[],
  round: number
): SwissRoundResult {
  // TODO:
  // 1. Filter out eliminated teams (losses >= threshold) and advanced teams (wins >= threshold)
  // 2. Sort by wins DESC, then buchholz DESC, then seed index
  // 3. Implement matching: try to pair teams[i] with teams[i+1]
  //    - If rematch, find next valid opponent
  //    - If no valid opponent for a team, backtrack
  // 4. Handle odd team → bye for lowest-ranked team
  throw new Error("Not implemented: generatePairings")
}

/**
 * Converts a round's pairings into BracketSlotNode objects for persistence.
 */
export function pairingsToBracketSlots(
  pairings: SwissRoundResult,
  round: number
): BracketSlotNode[] {
  // TODO:
  // Each pairing becomes one BracketSlot per team in the pair (position = pairing index)
  // Byes get isBye=true slots
  throw new Error("Not implemented: pairingsToBracketSlots")
}

// ---------------------------------------------------------------------------
// Record management
// ---------------------------------------------------------------------------

/**
 * Updates the Swiss records after a round completes.
 * Increments win/loss counts and buchholz scores.
 *
 * @param records   Current records (mutated in place).
 * @param results   Map of teamId → true (won) | false (lost).
 */
export function applyRoundResults(
  records: SwissRecord[],
  results: Map<string, boolean>
): void {
  // TODO:
  // For each team in results:
  //   - Increment wins or losses
  //   - Update buchholz: add opponent's current win count
  //   - Append opponent to seen list
}

/**
 * Returns all teams that have reached the advancement threshold.
 */
export function getAdvancedTeams(
  records: SwissRecord[],
  winThreshold: number
): string[] {
  return records
    .filter((r) => r.wins >= winThreshold)
    .map((r) => r.teamId)
}

/**
 * Returns all teams that have been eliminated.
 */
export function getEliminatedTeams(
  records: SwissRecord[],
  lossThreshold: number
): string[] {
  return records
    .filter((r) => r.losses >= lossThreshold)
    .map((r) => r.teamId)
}

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/**
 * Builds initial SwissRecord entries from a seeded list of teamIds.
 */
export function buildInitialRecords(seededTeamIds: string[]): SwissRecord[] {
  return seededTeamIds.map((teamId) => ({
    teamId,
    wins: 0,
    losses: 0,
    opponents: [],
    buchholz: 0,
  }))
}
