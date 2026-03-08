/**
 * bracket.ts
 *
 * Shared types for the bracket system.
 * Used by bracket services, API routes, and the BracketViewer UI component.
 */

import type { BracketType, BracketSide } from "@prisma/client"
import type { TeamSummary, MatchSummary } from "./api"

// ---------------------------------------------------------------------------
// Slot / node
// ---------------------------------------------------------------------------

/**
 * A single node in the bracket tree.
 * Mirrors BracketSlot joined with optional team and match data.
 */
export interface BracketSlotNode {
  id:         string
  bracketId:  string
  round:      number
  position:   number
  side:       BracketSide | null
  seedNumber: number | null
  isBye:      boolean
  team:       TeamSummary | null
  match:      MatchSummary | null
}

// ---------------------------------------------------------------------------
// Full bracket tree
// ---------------------------------------------------------------------------

/** Complete bracket data for one division — grouped by round. */
export interface BracketTree {
  id:                string
  divisionId:        string
  type:              BracketType
  totalRounds:       number | null
  isGenerated:       boolean
  generatedAt:       string | null
  currentSwissRound: number | null
  /** All slots, grouped by round number (1-based). */
  rounds:            BracketRound[]
}

/** All slots for a single round in the bracket. */
export interface BracketRound {
  round:       number
  winnersSlots: BracketSlotNode[]
  losersSlots:  BracketSlotNode[]  // empty for single-elim / swiss / GSL
  grandFinals?: BracketSlotNode    // only in double-elim
}

// ---------------------------------------------------------------------------
// Double-elimination specific
// ---------------------------------------------------------------------------

export interface DoubleElimBracket extends BracketTree {
  type: "DOUBLE_ELIMINATION"
  winners: BracketRound[]
  losers:  BracketRound[]
  grandFinals: BracketSlotNode | null
}

// ---------------------------------------------------------------------------
// Swiss specific
// ---------------------------------------------------------------------------

export interface SwissRecord {
  teamId:    string
  team?:     TeamSummary
  wins:      number
  losses:    number
  /** Opponents faced in previous rounds (used for pairing — no rematches). */
  opponents: string[]
}

export interface SwissPairing {
  slotA: BracketSlotNode
  slotB: BracketSlotNode | null  // null = bye
}

export interface SwissBracket extends BracketTree {
  type:    "SWISS"
  records: SwissRecord[]
}

// ---------------------------------------------------------------------------
// GSL specific
// ---------------------------------------------------------------------------

/**
 * A GSL group (4-team, 3-round mini-bracket).
 * Round 1: (1v2, 3v4) → Round 2: (winner A vs loser B, loser A vs winner B) → Decider
 */
export interface GslGroup {
  groupIndex: number
  teams:      TeamSummary[]   // seeded order: [seed1, seed2, seed3, seed4]
  slots:      BracketSlotNode[]
}

export interface GslBracket extends BracketTree {
  type:   "GSL"
  groups: GslGroup[]
}

// ---------------------------------------------------------------------------
// Advancement summary (used by UI to show "advances to" arrows)
// ---------------------------------------------------------------------------

export interface SlotAdvancement {
  fromSlotId:   string
  toSlotId:     string
  onWin:        boolean  // true = winner goes here; false = loser goes here
}

// ---------------------------------------------------------------------------
// Generate bracket input
// ---------------------------------------------------------------------------

export interface GenerateBracketInput {
  type:            BracketType
  seededTeamIds:   string[]   // ordered by seed (index 0 = seed 1)
}
