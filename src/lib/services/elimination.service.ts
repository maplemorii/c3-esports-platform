/**
 * elimination.service.ts
 *
 * Single and Double Elimination bracket generation and advancement.
 *
 * Double Elimination structure:
 *  - Winners bracket: log2(n) rounds; loser drops to losers bracket
 *  - Losers bracket: 2 * (log2(n) - 1) rounds; loser is eliminated
 *  - Grand Finals: winners bracket winner vs losers bracket winner
 *    (optional bracket reset if the winners-bracket team loses game 1)
 *
 * BracketSlot.side values:
 *  - "WINNERS"     — winners bracket slot
 *  - "LOSERS"      — losers bracket slot
 *  - "GRAND_FINALS"— final match slot
 *
 * Seeding: standard power-of-2 bye placement.
 *  - If teams count is not a power of 2, top seeds receive byes in round 1.
 *  - e.g. 6 teams → seeds 1 and 2 get byes, seeds 3-6 play round 1.
 */

import type { BracketSlotNode } from "./bracket.service"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlotAddress {
  round: number
  position: number
  side: "WINNERS" | "LOSERS" | "GRAND_FINALS"
}

// ---------------------------------------------------------------------------
// Double Elimination
// ---------------------------------------------------------------------------

/**
 * Generates the full initial slot layout for a Double Elimination bracket.
 * Returns all BracketSlotNode objects for round 1 (with byes where applicable).
 * Subsequent rounds are created as teams advance.
 *
 * @param seededTeamIds  Teams ordered 1st to last seed.
 */
export function generateDoubleElimRound1(
  seededTeamIds: string[]
): BracketSlotNode[] {
  // TODO:
  // 1. Determine next power of 2 >= seededTeamIds.length
  // 2. Build round-1 matchups using standard seeding (1 vs last, 2 vs second-last …)
  // 3. Teams that receive byes get isBye=true slots; they advance to round 2 automatically
  // 4. Return BracketSlotNode[]
  throw new Error("Not implemented: generateDoubleElimRound1")
}

/**
 * Given a completed slot in a Double Elimination bracket, returns the
 * SlotAddress for the winner and (if applicable) the loser's next slot.
 *
 * @param slot    The slot that just completed.
 * @param won     true = the team in this slot won, false = they lost.
 */
export function getNextSlotDE(
  slot: { round: number; position: number; side: "WINNERS" | "LOSERS" | "GRAND_FINALS" },
  won: boolean
): SlotAddress | null {
  // TODO:
  // Winners bracket winner → next winners bracket round
  // Winners bracket loser  → losers bracket (computed drop-in position)
  // Losers bracket winner  → next losers bracket round (or grand finals)
  // Losers bracket loser   → eliminated (return null)
  // Grand Finals winner    → champion (return null)
  // Grand Finals loser     → eliminated (return null)
  throw new Error("Not implemented: getNextSlotDE")
}

/**
 * Calculates the losers bracket drop-in position for a team that just lost
 * in the winners bracket.
 *
 * The losers bracket position depends on the winners bracket round and
 * which "side" of the bracket the team was on (upper/lower half of draw).
 */
export function getLoserDropPosition(
  winnersRound: number,
  winnersPosition: number
): { round: number; position: number } {
  // TODO:
  // Standard double-elim drop mapping:
  //   WR1 → LR1 (reversed seed order)
  //   WR2 → LR2
  //   WR3 → LR4, etc.
  throw new Error("Not implemented: getLoserDropPosition")
}

// ---------------------------------------------------------------------------
// Single Elimination
// ---------------------------------------------------------------------------

/**
 * Generates round-1 slots for a Single Elimination bracket.
 */
export function generateSingleElimRound1(
  seededTeamIds: string[]
): BracketSlotNode[] {
  // TODO:
  // 1. Same as DE round 1 but without losers bracket
  // 2. All slots use side="WINNERS" (no LOSERS/GRAND_FINALS distinction needed)
  throw new Error("Not implemented: generateSingleElimRound1")
}

/**
 * Returns the next slot for a Single Elimination winner.
 * Losers are eliminated (returns null for loser path).
 */
export function getNextSlotSE(
  round: number,
  position: number,
  won: boolean
): SlotAddress | null {
  if (!won) return null   // eliminated
  return {
    round: round + 1,
    position: Math.floor(position / 2),
    side: "WINNERS",
  }
}

// ---------------------------------------------------------------------------
// Seeding helpers
// ---------------------------------------------------------------------------

/**
 * Returns the next power of 2 >= n.
 * e.g. 6 → 8, 8 → 8, 9 → 16
 */
export function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

/**
 * Builds the standard seeded round-1 matchup order.
 * For 8 teams: [1v8, 4v5, 3v6, 2v7] (bracket positions 0-3).
 *
 * @param totalSlots  Power-of-2 bracket size (e.g. 8 for 6-8 teams).
 * @returns           Array of [topSeedIndex, bottomSeedIndex] pairs (0-based).
 */
export function buildSeedMatchups(totalSlots: number): Array<[number, number]> {
  // TODO:
  // Standard seeding algorithm:
  // Start with [1, totalSlots], recursively split each range
  // e.g. 8 slots: [1,8] → [1,8],[4,5] → [1,8],[4,5],[2,7],[3,6]
  // Sort into bracket order
  throw new Error("Not implemented: buildSeedMatchups")
}
