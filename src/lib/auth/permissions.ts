/**
 * src/lib/auth/permissions.ts
 *
 * Fine-grained permission helpers for API routes and Server Actions.
 *
 * Usage pattern (in a Route Handler):
 *   const { session, error } = await requireAuth()
 *   if (error) return error
 *
 *   const allowed = await canManageTeam(session, teamId)
 *   if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
 */

import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { prisma } from "@/lib/prisma"
import { hasMinRole } from "@/lib/roles"

// ---------------------------------------------------------------------------
// Re-export the async session helpers so callers only need one import.
// ---------------------------------------------------------------------------
export { requireAuth, requireRole, getSession } from "@/lib/session"

// ---------------------------------------------------------------------------
// Team permissions
// ---------------------------------------------------------------------------

/**
 * Returns true if the user may manage the given team.
 * Allowed when: user owns the team, OR user is STAFF+.
 */
export async function canManageTeam(
  session: Session,
  teamId: string
): Promise<boolean> {
  if (hasMinRole(session.user.role, "STAFF")) return true

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  })

  return team?.ownerId === session.user.id
}

/**
 * Returns a 403 NextResponse if the user cannot manage the team, otherwise null.
 *
 * @example
 * const denied = await assertCanManageTeam(session, teamId)
 * if (denied) return denied
 */
export async function assertCanManageTeam(
  session: Session,
  teamId: string
): Promise<NextResponse | null> {
  const allowed = await canManageTeam(session, teamId)
  return allowed ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// ---------------------------------------------------------------------------
// Match permissions
// ---------------------------------------------------------------------------

/**
 * Returns true if the user may submit a result for the given match.
 * Allowed when: the user's player record is on an active roster for either
 * the home or away team in this match, OR the user is STAFF+.
 */
export async function canSubmitResult(
  session: Session,
  matchId: string
): Promise<boolean> {
  if (hasMinRole(session.user.role, "STAFF")) return true

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { homeTeamId: true, awayTeamId: true },
  })
  if (!match) return false

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!player) return false

  const membership = await prisma.teamMembership.findFirst({
    where: {
      playerId: player.id,
      leftAt: null,
      teamId: { in: [match.homeTeamId, match.awayTeamId] },
    },
    select: { id: true },
  })

  return !!membership
}

/**
 * Returns a 403 NextResponse if the user cannot submit a result for this match,
 * otherwise null.
 *
 * @example
 * const denied = await assertCanSubmitResult(session, matchId)
 * if (denied) return denied
 */
export async function assertCanSubmitResult(
  session: Session,
  matchId: string
): Promise<NextResponse | null> {
  const allowed = await canSubmitResult(session, matchId)
  return allowed ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// ---------------------------------------------------------------------------
// Replay upload permissions
// ---------------------------------------------------------------------------

/**
 * Returns true if the user may upload a replay for the given match.
 * Same rule as canSubmitResult — roster member of either team, or STAFF+.
 */
export async function canUploadReplay(
  session: Session,
  matchId: string
): Promise<boolean> {
  return canSubmitResult(session, matchId)
}
