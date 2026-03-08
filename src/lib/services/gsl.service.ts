/**
 * gsl.service.ts
 *
 * GSL (Global StarCraft II League) group stage format.
 *
 * Standard GSL format (4 teams per group):
 *  - Round 1: #1 seed vs #4 seed, #2 seed vs #3 seed (BO3)
 *  - Round 2 (Decider): R1 loser vs R1 loser (elimination), R1 winner vs R1 winner (advancement)
 *  - Round 3: Remaining winner vs remaining winner (top of group)
 *
 * Outcome per group:
 *  - 1st place: 2-0 winner
 *  - 2nd place: 1-1 → wins decider
 *  - Eliminated: 0-2 loser; 1-1 → loses decider
 *
 * BracketSlot usage in GSL:
 *  - round=1 → opening matches
 *  - round=2 → winners match + losers match (decider)
 *  - round=3 → grand final of the group
 *  - side="WINNERS" | "LOSERS" distinguishes the two round-2 matches
 */

import type { BracketSlotNode } from "./bracket.service"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GslGroup {
  groupIndex: number   // 0-based
  /** Ordered: [seed1, seed2, seed3, seed4] — 1st and 4th play first, 2nd and 3rd play second. */
  teamIds: string[]
}

export interface GslGroupResult {
  first: string    // teamId — advances as group winner
  second: string   // teamId — advances as runner-up
  eliminated: [string, string]  // two eliminated teamIds
}

// ---------------------------------------------------------------------------
// Group generation
// ---------------------------------------------------------------------------

/**
 * Divides a seeded list of teams into GSL groups of 4.
 *
 * Seeding method (serpentine/snake draft to balance groups):
 *   8 teams, 2 groups → Group A: seeds 1,4,5,8 | Group B: seeds 2,3,6,7
 *
 * @param seededTeamIds  Teams sorted 1st to last seed.
 * @returns              Array of GslGroup objects.
 */
export function buildGroups(seededTeamIds: string[]): GslGroup[] {
  // TODO:
  // 1. Guard: seededTeamIds.length must be a multiple of 4
  // 2. Apply serpentine seeding to distribute teams across groups
  // 3. Return array of { groupIndex, teamIds }
  throw new Error("Not implemented: buildGroups")
}

/**
 * Returns the BracketSlotNode layout for all round-1 matches in a group.
 * round=1, position = 0 (match A: seed1 vs seed4), 1 (match B: seed2 vs seed3)
 */
export function groupRound1Slots(
  group: GslGroup,
  bracketIdPlaceholder: string = ""
): BracketSlotNode[] {
  // TODO:
  // Return two slots:
  //   { round: 1, position: group.groupIndex * 2 + 0, teamId: group.teamIds[0] } ← seed1
  //   { round: 1, position: group.groupIndex * 2 + 0, teamId: group.teamIds[3] } ← seed4
  //   { round: 1, position: group.groupIndex * 2 + 1, teamId: group.teamIds[1] } ← seed2
  //   { round: 1, position: group.groupIndex * 2 + 1, teamId: group.teamIds[2] } ← seed3
  throw new Error("Not implemented: groupRound1Slots")
}

// ---------------------------------------------------------------------------
// Advancement logic
// ---------------------------------------------------------------------------

/**
 * Given round-1 results for a group, returns the round-2 pairings.
 *
 *  - Winners bracket: round1MatchA winner vs round1MatchB winner
 *  - Losers bracket: round1MatchA loser  vs round1MatchB loser  (decider)
 */
export function getRound2Pairings(
  round1WinnerA: string,  // winner of seed1 vs seed4
  round1WinnerB: string,  // winner of seed2 vs seed3
  round1LoserA:  string,
  round1LoserB:  string
): { winners: [string, string]; losers: [string, string] } {
  return {
    winners: [round1WinnerA, round1WinnerB],
    losers:  [round1LoserA,  round1LoserB],
  }
}

/**
 * Resolves a group after all 3 rounds complete.
 * Returns the two advancing teams and two eliminated teams.
 */
export function resolveGroup(
  winnersMatchWinner: string,
  winnersMatchLoser:  string,
  losersMatchWinner:  string,
  losersMatchLoser:   string
): GslGroupResult {
  return {
    first:      winnersMatchWinner,  // went 2-0
    second:     losersMatchWinner,   // went 1-1, won decider
    eliminated: [winnersMatchLoser, losersMatchLoser],
  }
}

// ---------------------------------------------------------------------------
// Slot routing helpers
// ---------------------------------------------------------------------------

/**
 * Returns the target BracketSlot round/position/side for a team based on
 * their round-2 outcome.
 *
 * Used by bracket.service.advanceWinner() to populate the next slot.
 */
export function getNextSlotAfterRound2(
  side: "WINNERS" | "LOSERS",
  won: boolean
): { round: number; side: "WINNERS" | "LOSERS" | null } {
  // TODO:
  // Winners match winner  → round 3 (group final)
  // Winners match loser   → round 3 (second seed play-in — platform-specific)
  // Losers match winner   → round 3 (group final contention)
  // Losers match loser    → eliminated (no further round)
  throw new Error("Not implemented: getNextSlotAfterRound2")
}
