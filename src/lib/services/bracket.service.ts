/**
 * bracket.service.ts
 *
 * Bracket generation orchestration layer.
 * Delegates to the algorithm-specific services (elimination, swiss, gsl)
 * and owns the DB write layer (BracketSlot creation, match creation on advancement).
 *
 * Called by:
 *  - POST /api/divisions/:divisionId/bracket/generate
 *  - When a bracket match completes and the winner must advance
 */

import { prisma } from "@/lib/prisma"
import type { Bracket, BracketSlot, BracketType } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateBracketInput {
  type: BracketType
  /** Ordered array of teamIds from 1st seed to last. If omitted, seeded from standings. */
  seeds?: string[]
}

export interface BracketSlotNode {
  round: number
  position: number
  side?: "WINNERS" | "LOSERS" | "GRAND_FINALS"
  teamId?: string
  seedNumber?: number
  isBye?: boolean
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a bracket for a division.
 * Creates the Bracket record and all initial BracketSlot rows.
 * Creates Match rows for round 1 (or week 1 of Swiss).
 *
 * Delegates to the appropriate algorithm service.
 */
export async function generateBracket(
  divisionId: string,
  input: GenerateBracketInput,
  staffId: string
): Promise<Bracket> {
  // TODO:
  // 1. Guard: no existing generated bracket for divisionId (or reset first)
  // 2. If seeds not provided, derive from StandingEntry order for divisionId
  // 3. Delegate to algorithm service:
  //    - DOUBLE_ELIMINATION → elimination.service.generateDoubleElim()
  //    - SINGLE_ELIMINATION → elimination.service.generateSingleElim()
  //    - SWISS              → swiss.service.generateFirstRound()
  //    - GSL                → gsl.service.generateGroups()
  // 4. Persist BracketSlot rows returned from the algorithm
  // 5. Create Match rows for round-1 slots that have two teams
  // 6. Update Bracket: isGenerated=true, generatedAt=now()
  // 7. Write AuditLog: action="BRACKET_GENERATED"
  throw new Error("Not implemented: generateBracket")
}

/**
 * Records a match result within a bracket and advances the winner
 * (and loser, in double elimination) to the correct next slot.
 * Creates the next Match when both teams for a slot are determined.
 *
 * Called by matchStatus.service after a bracket match reaches COMPLETED.
 */
export async function advanceWinner(
  completedMatchId: string
): Promise<void> {
  // TODO:
  // 1. Fetch match with bracketSlot, homeTeam, awayTeam, winnerId
  // 2. Guard: match.isBracketMatch must be true
  // 3. Determine loserId
  // 4. Delegate advancement logic to algorithm service based on bracket.type:
  //    - DE: elimination.service.getNextSlot(slot, won/lost)
  //    - Swiss: swiss.service.recordResult() — Swiss doesn't "advance" per slot
  //    - GSL: gsl.service.advanceFromGroup()
  // 5. Update winner's (and loser's) target BracketSlot.teamId
  // 6. If target slot now has both teams, create the next Match
  throw new Error("Not implemented: advanceWinner")
}

/**
 * Resets a bracket — deletes all BracketSlot rows and the Bracket record.
 * Also cancels any bracket Match rows that haven't started.
 * Admin-only action.
 */
export async function resetBracket(divisionId: string, adminId: string): Promise<void> {
  // TODO:
  // 1. Fetch bracket for divisionId
  // 2. Guard: bracket must not have COMPLETED matches
  // 3. Cancel SCHEDULED bracket matches
  // 4. Delete BracketSlot rows (cascade deletes from schema)
  // 5. Delete Bracket record
  // 6. Write AuditLog: action="BRACKET_RESET"
  throw new Error("Not implemented: resetBracket")
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Persists an array of BracketSlotNode objects as BracketSlot rows.
 * Used by algorithm services to hand off slot data without needing prisma.
 */
export async function createBracketSlots(
  bracketId: string,
  slots: BracketSlotNode[]
): Promise<BracketSlot[]> {
  // TODO:
  // prisma.bracketSlot.createManyAndReturn(...)
  throw new Error("Not implemented: createBracketSlots")
}

/**
 * Creates a Match for a bracket slot that now has two teams assigned.
 */
export async function createMatchForSlot(
  bracketSlotId: string,
  divisionId: string,
  staffId: string
): Promise<void> {
  // TODO:
  // 1. Fetch BracketSlot: round, position, teamId (just assigned), bracket → division
  // 2. Fetch the opposing slot to get the second teamId
  // 3. createMatch({ divisionId, homeTeamId, awayTeamId, isBracketMatch: true, bracketSlotId })
  throw new Error("Not implemented: createMatchForSlot")
}
