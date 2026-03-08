/**
 * matchStatus.service.ts
 *
 * Single source of truth for all match status transitions.
 *
 * Every transition is guarded: calling transitionTo() with an invalid
 * transition throws a MatchTransitionError so API routes get a clean 400.
 *
 * Valid transition graph:
 *
 *   SCHEDULED
 *     → CHECKING_IN     (cron: checkInOpenAt reached)
 *     → CANCELLED       (staff)
 *
 *   CHECKING_IN
 *     → IN_PROGRESS     (both teams checked in)
 *     → FORFEITED       (cron: checkInDeadlineAt reached, one team missed)
 *     → NO_SHOW         (cron: checkInDeadlineAt reached, both teams missed)
 *     → CANCELLED       (staff)
 *
 *   IN_PROGRESS
 *     → MATCH_FINISHED  (all game slots resolved — replay or manual)
 *     → FORFEITED       (staff)
 *     → CANCELLED       (staff)
 *
 *   MATCH_FINISHED
 *     → VERIFYING       (one-sided submission or single-team replay upload)
 *     → COMPLETED       (both-team replay upload fast path, or staff entry)
 *     → DISPUTED        (score mismatch detected)
 *
 *   VERIFYING
 *     → COMPLETED       (opponent confirms)
 *     → DISPUTED        (opponent disputes, or cron escalation)
 *
 *   DISPUTED
 *     → COMPLETED       (staff resolves with a result)
 *     → CANCELLED       (staff dismisses)
 *
 *   FORFEITED / NO_SHOW / COMPLETED / CANCELLED — terminal (staff override only)
 */

import { prisma } from "@/lib/prisma"
import type { MatchStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class MatchTransitionError extends Error {
  constructor(
    public readonly matchId: string,
    public readonly from: MatchStatus,
    public readonly to: MatchStatus
  ) {
    super(`Invalid match transition: ${from} → ${to} (match ${matchId})`)
    this.name = "MatchTransitionError"
  }
}

// ---------------------------------------------------------------------------
// Transition table
// ---------------------------------------------------------------------------

type TransitionMap = Partial<Record<MatchStatus, MatchStatus[]>>

/** All valid non-override transitions. */
const VALID_TRANSITIONS: TransitionMap = {
  SCHEDULED:      ["CHECKING_IN", "CANCELLED"],
  CHECKING_IN:    ["IN_PROGRESS", "FORFEITED", "NO_SHOW", "CANCELLED"],
  IN_PROGRESS:    ["MATCH_FINISHED", "FORFEITED", "CANCELLED"],
  MATCH_FINISHED: ["VERIFYING", "COMPLETED", "DISPUTED"],
  VERIFYING:      ["COMPLETED", "DISPUTED"],
  DISPUTED:       ["COMPLETED", "CANCELLED"],
  // Terminal states allow COMPLETED override by staff (handled separately)
}

export function isValidTransition(from: MatchStatus, to: MatchStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates and performs a status transition, writing an AuditLog entry.
 *
 * @param matchId   - The match to transition.
 * @param to        - The target status.
 * @param actorId   - userId performing the transition (for audit).
 * @param notes     - Optional reason/notes attached to the transition.
 */
export async function transitionTo(
  matchId: string,
  to: MatchStatus,
  actorId: string,
  notes?: string
): Promise<void> {
  // TODO:
  // 1. Fetch current match status
  // 2. Validate via isValidTransition(); throw MatchTransitionError if invalid
  // 3. prisma.match.update({ status: to, ...(to === "COMPLETED" ? { completedAt: new Date() } : {}) })
  // 4. prisma.auditLog.create({ actorId, action: `MATCH_${to}`, entityType: "Match", entityId: matchId, after: { status: to, notes } })
  throw new Error("Not implemented: transitionTo")
}

/**
 * Staff override — forces any terminal/non-terminal status to COMPLETED.
 * Reverses prior standings contributions if the match was already COMPLETED.
 */
export async function staffOverrideComplete(
  matchId: string,
  staffId: string,
  reason: string
): Promise<void> {
  // TODO:
  // 1. If current status is COMPLETED, call reverseMatchFromStandings(matchId)
  // 2. Update match: status=COMPLETED, enteredByStaffId=staffId, completedAt=now()
  // 3. Call applyMatchToStandings(matchId)
  // 4. Write AuditLog: action="STAFF_RESULT_OVERRIDE"
  throw new Error("Not implemented: staffOverrideComplete")
}

// ---------------------------------------------------------------------------
// Convenience guards (used in Route Handlers)
// ---------------------------------------------------------------------------

/** Throws if the match is not in one of the allowed statuses. */
export async function assertMatchStatus(
  matchId: string,
  allowed: MatchStatus[]
): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    select: { status: true },
  })
  if (!allowed.includes(match.status)) {
    throw new MatchTransitionError(matchId, match.status, allowed[0])
  }
}
